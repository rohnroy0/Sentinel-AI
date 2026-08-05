-- Normalized tables for Sentinel-AI

-- Findings
CREATE TABLE IF NOT EXISTS findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investigation_id UUID REFERENCES investigations(id) ON DELETE CASCADE,
    severity TEXT,
    cve_id TEXT,
    evidence TEXT
);
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own findings" ON findings FOR SELECT USING (
    investigation_id IN (SELECT id FROM investigations WHERE user_id = auth.uid())
);

-- Decision Logs
CREATE TABLE IF NOT EXISTS decision_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investigation_id UUID REFERENCES investigations(id) ON DELETE CASCADE,
    stage TEXT,
    reasoning TEXT,
    evidence TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE decision_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own decision_logs" ON decision_logs FOR SELECT USING (
    investigation_id IN (SELECT id FROM investigations WHERE user_id = auth.uid())
);

-- Attack Chains
CREATE TABLE IF NOT EXISTS attack_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investigation_id UUID REFERENCES investigations(id) ON DELETE CASCADE,
    graph_data JSONB
);
ALTER TABLE attack_chains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own attack_chains" ON attack_chains FOR SELECT USING (
    investigation_id IN (SELECT id FROM investigations WHERE user_id = auth.uid())
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investigation_id UUID REFERENCES investigations(id) ON DELETE CASCADE,
    report_data JSONB
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reports" ON reports FOR SELECT USING (
    investigation_id IN (SELECT id FROM investigations WHERE user_id = auth.uid())
);
