import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const API_BASE = Platform.select({
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

interface BuildItem {
  id: number;
  commitSha: string;
  version: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  branch?: string;
  commitMessage?: string;
  startedAt: string;
}

interface BugItem {
  id: number;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  reporter: string;
}

interface ContainerItem {
  name: string;
  image: string;
  status: string;
  state: 'RUNNING' | 'STOPPED' | 'DEGRADED';
  cpuPercent: string;
  memPercent: string;
}

const INITIAL_BUILDS: BuildItem[] = [
  {
    id: 104,
    commitSha: '9f83a21b44c',
    version: '9f83a21',
    status: 'SUCCESS',
    branch: 'main',
    commitMessage: 'fix: resolve NestJS route shadowing & add query fallback',
    startedAt: '10 mins ago',
  },
  {
    id: 103,
    commitSha: '6c19df3320e',
    version: '6c19df3',
    status: 'RUNNING',
    branch: 'feature/mobile-workspace',
    commitMessage: 'feat: add interactive mobile sprint and QA tracking',
    startedAt: 'Just now',
  },
  {
    id: 102,
    commitSha: '3a77b819f01',
    version: '3a77b81',
    status: 'SUCCESS',
    branch: 'main',
    commitMessage: 'chore: configure MinIO presigned APK storage endpoints',
    startedAt: '1 hour ago',
  },
  {
    id: 101,
    commitSha: '11a0bb44d82',
    version: '11a0bb4',
    status: 'FAILED',
    branch: 'fix/docker-compose',
    commitMessage: 'fix: align postgres exposed port to 5433',
    startedAt: '2 hours ago',
  },
];

const INITIAL_BUGS: BugItem[] = [
  {
    id: 1,
    title: 'MinIO connection timeout during cold boot',
    description: 'Storage service threw unhandled exception when MinIO was initializing.',
    severity: 'CRITICAL',
    status: 'RESOLVED',
    reporter: 'Alex Rivera (DevOps)',
  },
  {
    id: 2,
    title: 'React Query provider missing in developer dashboard',
    description: 'useQuery hook threw error without QueryClientProvider wrapping main.tsx.',
    severity: 'HIGH',
    status: 'RESOLVED',
    reporter: 'Sarah Lin (QA)',
  },
  {
    id: 3,
    title: 'Missing projectId query param caused NaN database queries',
    description: 'GET /tasks without query params tried querying WHERE project.id = NaN.',
    severity: 'HIGH',
    status: 'RESOLVED',
    reporter: 'Douaa (Lead)',
  },
  {
    id: 4,
    title: 'Push notifications badge badge count desync on background resume',
    description: 'Badge count shows stale state after foregrounding app.',
    severity: 'MEDIUM',
    status: 'INVESTIGATING',
    reporter: 'Michael Chen (Mobile QA)',
  },
];

const INITIAL_CONTAINERS: ContainerItem[] = [
  {
    name: 'devflow-postgres',
    image: 'postgres:16-alpine',
    status: 'Up (Port 5433 -> 5432)',
    state: 'RUNNING',
    cpuPercent: '0.42%',
    memPercent: '1.18%',
  },
  {
    name: 'devflow-redis',
    image: 'redis:7-alpine',
    status: 'Up (Port 6379)',
    state: 'RUNNING',
    cpuPercent: '0.10%',
    memPercent: '0.54%',
  },
  {
    name: 'devflow-minio',
    image: 'minio/minio',
    status: 'Up (Port 9000 & 9001 console)',
    state: 'RUNNING',
    cpuPercent: '0.28%',
    memPercent: '1.65%',
  },
];

export default function ExploreScreen() {
  const [activeTab, setActiveTab] = useState<'BUILDS' | 'BUGS' | 'INFRA'>('BUILDS');
  const [builds, setBuilds] = useState<BuildItem[]>(INITIAL_BUILDS);
  const [bugs, setBugs] = useState<BugItem[]>(INITIAL_BUGS);
  const [containers, setContainers] = useState<ContainerItem[]>(INITIAL_CONTAINERS);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [triggeringBuild, setTriggeringBuild] = useState<boolean>(false);

  const fetchLiveInfo = async () => {
    try {
      const [buildRes, bugRes, infraRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/builds/recent`, { timeout: 2500 }),
        axios.get(`${API_BASE}/bugs`, { timeout: 2500 }),
        axios.get(`${API_BASE}/infrastructure/containers`, { timeout: 2500 }),
      ]);

      if (buildRes.status === 'fulfilled' && Array.isArray(buildRes.value.data) && buildRes.value.data.length > 0) {
        setBuilds(
          buildRes.value.data.map((b: any) => ({
            id: b.id,
            commitSha: b.commitSha,
            version: b.version || b.commitSha?.slice(0, 7),
            status: b.status,
            branch: b.branch || 'main',
            commitMessage: b.commitMessage || 'Build triggered automatically',
            startedAt: new Date(b.startedAt).toLocaleTimeString(),
          })),
        );
      }

      if (bugRes.status === 'fulfilled' && Array.isArray(bugRes.value.data) && bugRes.value.data.length > 0) {
        setBugs(
          bugRes.value.data.map((bg: any) => ({
            id: bg.id,
            title: bg.title,
            description: bg.description || '',
            severity: bg.severity || 'MEDIUM',
            status: bg.status || 'OPEN',
            reporter: bg.reportedBy?.username || 'QA Team',
          })),
        );
      }

      if (infraRes.status === 'fulfilled' && Array.isArray(infraRes.value.data) && infraRes.value.data.length > 0) {
        setContainers(infraRes.value.data);
      }
    } catch {
      // Kept fallback
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLiveInfo();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchLiveInfo();
  }, []);

  const triggerMockBuild = () => {
    setTriggeringBuild(true);
    setTimeout(() => {
      const newBuild: BuildItem = {
        id: Math.floor(Math.random() * 900) + 105,
        commitSha: Math.random().toString(16).substring(2, 12),
        version: Math.random().toString(16).substring(2, 9),
        status: 'RUNNING',
        branch: 'main',
        commitMessage: 'manual: mobile workspace build verification',
        startedAt: 'Just now',
      };
      setBuilds((prev) => [newBuild, ...prev]);
      setTriggeringBuild(false);
    }, 900);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#09090E' }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: BottomTabInset + Spacing.four },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A855F7" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandSubtitle}>DEVOPS & QUALITY ASSURANCE</Text>
            <Text style={styles.brandTitle}>Operations Center</Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'BUILDS' && styles.activeTabButton]}
            onPress={() => setActiveTab('BUILDS')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'BUILDS' && styles.activeTabButtonText]}>
              CI/CD Pipelines ({builds.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'BUGS' && styles.activeTabButton]}
            onPress={() => setActiveTab('BUGS')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'BUGS' && styles.activeTabButtonText]}>
              QA Bugs ({bugs.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'INFRA' && styles.activeTabButton]}
            onPress={() => setActiveTab('INFRA')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'INFRA' && styles.activeTabButtonText]}>
              Containers
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: BUILDS */}
        {activeTab === 'BUILDS' && (
          <View>
            <View style={styles.actionRow}>
              <Text style={styles.sectionHeading}>Pipeline History</Text>
              <TouchableOpacity
                style={styles.triggerButton}
                onPress={triggerMockBuild}
                disabled={triggeringBuild}
              >
                {triggeringBuild ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.triggerButtonText}>+ Trigger Build</Text>
                )}
              </TouchableOpacity>
            </View>

            {builds.map((build) => {
              const statusColors: Record<string, { bg: string; text: string }> = {
                SUCCESS: { bg: '#064E3B', text: '#34D399' },
                RUNNING: { bg: '#1E3A8A', text: '#60A5FA' },
                FAILED: { bg: '#881337', text: '#FB7185' },
                PENDING: { bg: '#78350F', text: '#FBBF24' },
              };
              const colorInfo = statusColors[build.status] || { bg: '#1E293B', text: '#94A3B8' };

              return (
                <View key={build.id} style={styles.buildCard}>
                  <View style={styles.buildTop}>
                    <View style={styles.buildLeft}>
                      <Text style={styles.buildSha}>#{build.id} • {build.version}</Text>
                      <Text style={styles.buildBranch}>git: {build.branch}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: colorInfo.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: colorInfo.text }]}>
                        {build.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.buildMsg}>{build.commitMessage}</Text>

                  <View style={styles.buildFooter}>
                    <Text style={styles.buildTime}>Started: {build.startedAt}</Text>
                    <Text style={styles.buildAction}>View pipeline logs →</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* TAB 2: QA BUGS */}
        {activeTab === 'BUGS' && (
          <View>
            <View style={styles.actionRow}>
              <Text style={styles.sectionHeading}>Issue Tracker</Text>
              <Text style={styles.sectionSub}>All reported QA tickets</Text>
            </View>

            {bugs.map((bug) => {
              const severityColors: Record<string, string> = {
                CRITICAL: '#F43F5E',
                HIGH: '#FB923C',
                MEDIUM: '#FBBF24',
                LOW: '#38BDF8',
              };

              return (
                <View key={bug.id} style={styles.bugCard}>
                  <View style={styles.bugHeader}>
                    <View style={[styles.severityTag, { borderColor: severityColors[bug.severity] }]}>
                      <Text style={[styles.severityText, { color: severityColors[bug.severity] }]}>
                        {bug.severity}
                      </Text>
                    </View>
                    <Text style={styles.bugStatus}>{bug.status}</Text>
                  </View>

                  <Text style={styles.bugTitle}>{bug.title}</Text>
                  <Text style={styles.bugDesc}>{bug.description}</Text>

                  <View style={styles.bugFooter}>
                    <Text style={styles.bugReporter}>Reported by: {bug.reporter}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* TAB 3: INFRASTRUCTURE */}
        {activeTab === 'INFRA' && (
          <View>
            <View style={styles.actionRow}>
              <Text style={styles.sectionHeading}>Docker Services</Text>
              <Text style={styles.sectionSub}>Local container fleet</Text>
            </View>

            {containers.map((c, i) => (
              <View key={i} style={styles.containerCard}>
                <View style={styles.containerHeader}>
                  <View style={styles.containerTitleGroup}>
                    <View style={styles.liveDot} />
                    <Text style={styles.containerName}>{c.name}</Text>
                  </View>
                  <View style={styles.stateBadge}>
                    <Text style={styles.stateBadgeText}>{c.state}</Text>
                  </View>
                </View>

                <Text style={styles.containerImage}>Image: {c.image}</Text>
                <Text style={styles.containerStatus}>{c.status}</Text>

                <View style={styles.metricRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>CPU Load</Text>
                    <Text style={styles.metricVal}>{c.cpuPercent}</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Memory Usage</Text>
                    <Text style={styles.metricVal}>{c.memPercent}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: Spacing.three,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#A855F7',
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#12121A',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#262638',
    marginBottom: Spacing.three,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#9333EA',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
  },
  triggerButton: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  triggerButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  buildCard: {
    backgroundColor: '#12121A',
    borderRadius: 14,
    padding: Spacing.three,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#262638',
  },
  buildTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  buildLeft: {
    flex: 1,
  },
  buildSha: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  buildBranch: {
    fontSize: 11,
    color: '#A855F7',
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  buildMsg: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 8,
  },
  buildFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E1E2D',
    paddingTop: 8,
  },
  buildTime: {
    fontSize: 11,
    color: '#64748B',
  },
  buildAction: {
    fontSize: 11,
    color: '#A855F7',
    fontWeight: '600',
  },
  bugCard: {
    backgroundColor: '#12121A',
    borderRadius: 14,
    padding: Spacing.three,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#262638',
  },
  bugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityTag: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  bugStatus: {
    fontSize: 11,
    color: '#34D399',
    fontWeight: '700',
  },
  bugTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  bugDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 10,
  },
  bugFooter: {
    borderTopWidth: 1,
    borderTopColor: '#1E1E2D',
    paddingTop: 6,
  },
  bugReporter: {
    fontSize: 11,
    color: '#64748B',
  },
  containerCard: {
    backgroundColor: '#12121A',
    borderRadius: 14,
    padding: Spacing.three,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#262638',
  },
  containerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  containerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  containerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  stateBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stateBadgeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
  },
  containerImage: {
    fontSize: 12,
    color: '#A855F7',
    marginBottom: 2,
  },
  containerStatus: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#181824',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
});
