import sqlite3
import os
import json
import uuid
from typing import Dict, Any, List, Optional
from database.adapter import BaseDatabaseAdapter
from config import config
from utils.logger import logger

class SQLiteAdapter(BaseDatabaseAdapter):
    """Production-grade SQLite Database Adapter for Development and Local Deployments."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or config.DATABASE_PATH
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS investigations (
                id TEXT PRIMARY KEY,
                user_goal TEXT,
                status TEXT,
                scan_data TEXT,
                discovered_hosts TEXT,
                vulnerabilities TEXT,
                selected_tools TEXT,
                decision_log TEXT,
                final_report TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id TEXT,
                tool_results TEXT,
                explained_findings TEXT,
                remediation TEXT,
                risk_dashboard TEXT,
                investigation_graph TEXT,
                attack_chains TEXT,
                full_state TEXT
            )
            """)

            # Auto-migrate existing SQLite tables to ensure all required columns exist
            existing_cols = [row[1] for row in cursor.execute("PRAGMA table_info(investigations)").fetchall()]
            required_cols = {
                "user_id": "TEXT",
                "tool_results": "TEXT",
                "explained_findings": "TEXT",
                "remediation": "TEXT",
                "risk_dashboard": "TEXT",
                "investigation_graph": "TEXT",
                "attack_chains": "TEXT",
                "full_state": "TEXT",
            }
            for col, col_type in required_cols.items():
                if col not in existing_cols:
                    cursor.execute(f"ALTER TABLE investigations ADD COLUMN {col} {col_type}")

            conn.commit()
            conn.close()
            logger.info(f"SQLite database initialized at: {self.db_path}")
        except Exception as e:
            logger.error(f"Failed to initialize SQLite database: {e}")
            raise

    def save_investigation(self, state: Dict[str, Any]) -> bool:
        user_id = state.get("user_id")
        if not user_id:
            logger.error("SQLiteAdapter save_investigation rejected: user_id is missing.")
            return False

        inv_id = state.get("investigation_id") or state.get("id") or str(uuid.uuid4())
        state["investigation_id"] = inv_id

        user_goal = state.get("user_goal") or state.get("scan_name") or "Autonomous Investigation"
        status = state.get("current_status") or state.get("status") or "Completed"
        scan_data = state.get("scan_data", "")

        discovered_hosts = json.dumps(state.get("discovered_hosts", []))
        vulnerabilities = json.dumps(state.get("vulnerabilities", state.get("findings", [])))
        selected_tools = json.dumps(state.get("selected_tools", []))
        decision_log = json.dumps(state.get("decision_log", []))
        final_report = json.dumps(state.get("final_report", state.get("report", {})))
        tool_results = json.dumps(state.get("tool_results", {}))
        explained_findings = json.dumps(state.get("explained_findings", []))
        remediation = json.dumps(state.get("remediation", []))
        risk_dashboard = json.dumps(state.get("risk_dashboard", {}))
        investigation_graph = json.dumps(state.get("investigation_graph", {}))
        attack_chains = json.dumps(state.get("attack_chains", []))
        full_state = json.dumps(state)

        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
            INSERT INTO investigations (
                id, user_goal, status, scan_data, discovered_hosts, vulnerabilities,
                selected_tools, decision_log, final_report, user_id, tool_results,
                explained_findings, remediation, risk_dashboard, investigation_graph,
                attack_chains, full_state
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                user_goal=excluded.user_goal,
                status=excluded.status,
                scan_data=excluded.scan_data,
                discovered_hosts=excluded.discovered_hosts,
                vulnerabilities=excluded.vulnerabilities,
                selected_tools=excluded.selected_tools,
                decision_log=excluded.decision_log,
                final_report=excluded.final_report,
                user_id=excluded.user_id,
                tool_results=excluded.tool_results,
                explained_findings=excluded.explained_findings,
                remediation=excluded.remediation,
                risk_dashboard=excluded.risk_dashboard,
                investigation_graph=excluded.investigation_graph,
                attack_chains=excluded.attack_chains,
                full_state=excluded.full_state
            """, (
                inv_id, user_goal, status, scan_data, discovered_hosts, vulnerabilities,
                selected_tools, decision_log, final_report, user_id, tool_results,
                explained_findings, remediation, risk_dashboard, investigation_graph,
                attack_chains, full_state
            ))
            conn.commit()
            return True
        except Exception as e:
            logger.error(f"SQLiteAdapter error saving investigation {inv_id}: {e}")
            return False
        finally:
            conn.close()

    def get_investigation_by_id(self, inv_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        if not user_id:
            logger.error("SQLiteAdapter get_investigation_by_id rejected: user_id is missing.")
            return None

        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "SELECT * FROM investigations WHERE id = ? AND user_id = ?",
                (inv_id, user_id)
            )
            row = cursor.fetchone()
            if not row:
                return None

            row_dict = dict(row)
            full_state = {}
            if row_dict.get("full_state"):
                try:
                    full_state = json.loads(row_dict["full_state"])
                except Exception:
                    pass

            state = {
                "investigation_id": row_dict["id"],
                "user_goal": row_dict.get("user_goal", ""),
                "current_status": row_dict.get("status", "Completed"),
                "inv_type": full_state.get("inv_type", "deterministic"),
                "scan_data": row_dict.get("scan_data", ""),
                "discovered_hosts": json.loads(row_dict.get("discovered_hosts") or "[]"),
                "vulnerabilities": json.loads(row_dict.get("vulnerabilities") or "[]"),
                "findings": json.loads(row_dict.get("vulnerabilities") or "[]"),
                "selected_tools": json.loads(row_dict.get("selected_tools") or "[]"),
                "decision_log": json.loads(row_dict.get("decision_log") or "[]"),
                "reasoning_steps": json.loads(row_dict.get("decision_log") or "[]"),
                "final_report": json.loads(row_dict.get("final_report") or "{}"),
                "tool_results": json.loads(row_dict.get("tool_results") or "{}"),
                "explained_findings": json.loads(row_dict.get("explained_findings") or "[]"),
                "remediation": json.loads(row_dict.get("remediation") or "[]"),
                "risk_dashboard": json.loads(row_dict.get("risk_dashboard") or "{}"),
                "investigation_graph": json.loads(row_dict.get("investigation_graph") or "{}"),
                "attack_chains": json.loads(row_dict.get("attack_chains") or "[]"),
                "user_id": row_dict.get("user_id"),
                "created_at": row_dict.get("created_at"),
            }

            # Merge full_state keys
            for k, v in full_state.items():
                if v and (k not in state or not state[k]):
                    state[k] = v

            return state
        except Exception as e:
            logger.error(f"SQLiteAdapter error fetching investigation {inv_id}: {e}")
            return None
        finally:
            conn.close()

    def get_all_investigations(self, user_id: str) -> List[Dict[str, Any]]:
        if not user_id:
            logger.error("SQLiteAdapter get_all_investigations rejected: user_id is missing.")
            return []

        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "SELECT * FROM investigations WHERE user_id = ? ORDER BY created_at DESC",
                (user_id,)
            )
            rows = cursor.fetchall()
            results = []
            for r in rows:
                row_dict = dict(r)
                full_state = {}
                if row_dict.get("full_state"):
                    try:
                        full_state = json.loads(row_dict["full_state"])
                    except Exception:
                        pass

                results.append({
                    "investigation_id": row_dict["id"],
                    "user_goal": row_dict.get("user_goal", ""),
                    "current_status": row_dict.get("status", "Completed"),
                    "vulnerabilities": json.loads(row_dict.get("vulnerabilities") or "[]"),
                    "discovered_hosts": json.loads(row_dict.get("discovered_hosts") or "[]"),
                    "created_at": row_dict.get("created_at"),
                    "user_id": row_dict.get("user_id")
                })
            return results
        except Exception as e:
            logger.error(f"SQLiteAdapter error fetching investigations for user {user_id}: {e}")
            return []
        finally:
            conn.close()

    def delete_investigation(self, inv_id: str, user_id: str) -> bool:
        if not user_id:
            logger.error("SQLiteAdapter delete_investigation rejected: user_id is missing.")
            return False

        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "DELETE FROM investigations WHERE id = ? AND user_id = ?",
                (inv_id, user_id)
            )
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"SQLiteAdapter error deleting investigation {inv_id}: {e}")
            return False
        finally:
            conn.close()

    def health_check(self) -> Dict[str, Any]:
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM investigations")
            count = cursor.fetchone()[0]
            conn.close()
            return {"status": "ok", "engine": "sqlite", "record_count": count}
        except Exception as e:
            return {"status": "error", "engine": "sqlite", "error": str(e)}
