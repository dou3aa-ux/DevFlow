import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Configurable API base for local dev (web: localhost, Android emulator: 10.0.2.2)
const API_BASE = Platform.select({
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

interface TaskItem {
  id: number;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  projectName: string;
}

interface ReleaseArtifact {
  id: number;
  version: string;
  type: string;
  fileSize: string;
  releaseNotes: string;
  downloadUrl: string;
}

const INITIAL_TASKS: TaskItem[] = [
  {
    id: 1,
    title: 'Finalize mobile release pipeline',
    description: 'Configure automated APK packaging and MinIO artifact signing',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    projectName: 'DevFlow Mobile',
  },
  {
    id: 2,
    title: 'Audit Docker container health endpoints',
    description: 'Ensure Postgres and Redis services report uptime correctly',
    status: 'TODO',
    priority: 'MEDIUM',
    projectName: 'Cloud Infrastructure',
  },
  {
    id: 3,
    title: 'Review stakeholder QA signoff',
    description: 'Verify all critical bugs marked resolved prior to sprint close',
    status: 'IN_REVIEW',
    priority: 'CRITICAL',
    projectName: 'DevFlow Core',
  },
  {
    id: 4,
    title: 'Migrate React Query v5 provider in frontend',
    description: 'Wrap root component to support developer dashboard queries',
    status: 'DONE',
    priority: 'HIGH',
    projectName: 'DevFlow Web',
  },
];

const INITIAL_RELEASES: ReleaseArtifact[] = [
  {
    id: 101,
    version: 'v1.4.0-rc1',
    type: 'APK',
    fileSize: '34.2 MB',
    releaseNotes: 'Optimized Expo runtime, added real-time CI status, fixed route shadowing.',
    downloadUrl: `${API_BASE}/artifacts/download/v1.4.0-rc1.apk`,
  },
  {
    id: 102,
    version: 'v1.3.2-stable',
    type: 'APK',
    fileSize: '31.8 MB',
    releaseNotes: 'Production stable build with offline cache support and JWT security.',
    downloadUrl: `${API_BASE}/artifacts/download/v1.3.2-stable.apk`,
  },
];

export default function HomeScreen() {
  const theme = useTheme();
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [releases, setReleases] = useState<ReleaseArtifact[]>(INITIAL_RELEASES);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const checkBackend = async () => {
    try {
      const res = await axios.get(`${API_BASE}/health`, { timeout: 2500 });
      if (res.data?.status === 'UP') {
        setApiConnected(true);
      } else {
        setApiConnected(true);
      }
    } catch {
      setApiConnected(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tasks`, { timeout: 3000 });
      if (Array.isArray(res.data) && res.data.length > 0) {
        setTasks(
          res.data.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description || 'No description provided.',
            status: t.status,
            priority: t.priority || 'MEDIUM',
            projectName: t.project?.name || 'DevFlow Core',
          })),
        );
      }
    } catch {
      // Fallback kept
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([checkBackend(), fetchTasks()]);
    setRefreshing(false);
  };

  useEffect(() => {
    checkBackend();
    fetchTasks();
  }, []);

  const toggleTaskStatus = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextStatus: Record<TaskItem['status'], TaskItem['status']> = {
          TODO: 'IN_PROGRESS',
          IN_PROGRESS: 'IN_REVIEW',
          IN_REVIEW: 'DONE',
          DONE: 'TODO',
        };
        return { ...t, status: nextStatus[t.status] };
      }),
    );
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesFilter = selectedFilter === 'ALL' || t.status === selectedFilter;
    const matchesProject = selectedProject === 'ALL' || t.projectName.includes(selectedProject);
    return matchesFilter && matchesProject;
  });

  const completedCount = tasks.filter((t) => t.status === 'DONE').length;
  const progressPercent = Math.round((completedCount / (tasks.length || 1)) * 100);

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
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandSubtitle}>WORKSPACE HUB</Text>
            <Text style={styles.brandTitle}>DevFlow Mobile</Text>
          </View>
          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: apiConnected ? '#22C55E' : apiConnected === false ? '#EF4444' : '#F59E0B' },
              ]}
            />
            <Text style={styles.statusText}>
              {apiConnected ? 'API Live' : apiConnected === false ? 'Offline Demo' : 'Checking...'}
            </Text>
          </View>
        </View>

        {/* Sprint Progress Hero Card */}
        <View style={styles.sprintCard}>
          <View style={styles.sprintHeader}>
            <View>
              <Text style={styles.sprintTag}>CURRENT SPRINT 14</Text>
              <Text style={styles.sprintTitle}>Sprint Velocity & Target</Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{progressPercent}%</Text>
            </View>
          </View>

          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          <View style={styles.sprintMetaRow}>
            <Text style={styles.sprintMetaText}>
              Completed: <Text style={styles.boldText}>{completedCount}</Text> of {tasks.length} tasks
            </Text>
            <Text style={styles.sprintMetaText}>Ends in: 4 days</Text>
          </View>
        </View>

        {/* Quick KPI Row */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{tasks.length}</Text>
            <Text style={styles.kpiLabel}>Total Tasks</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#38BDF8' }]}>3</Text>
            <Text style={styles.kpiLabel}>Active Builds</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#F43F5E' }]}>2</Text>
            <Text style={styles.kpiLabel}>Open Bugs</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#4ADE80' }]}>3/3</Text>
            <Text style={styles.kpiLabel}>Containers</Text>
          </View>
        </View>

        {/* Project Selector Chips */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Filter by Project</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {['ALL', 'DevFlow Core', 'DevFlow Web', 'DevFlow Mobile', 'Cloud Infrastructure'].map((proj) => (
            <TouchableOpacity
              key={proj}
              style={[styles.chip, selectedProject === proj && styles.activeChip]}
              onPress={() => setSelectedProject(proj)}
            >
              <Text style={[styles.chipText, selectedProject === proj && styles.activeChipText]}>
                {proj}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Task Status Filters */}
        <View style={styles.filterRow}>
          {['ALL', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterButton, selectedFilter === status && styles.activeFilterButton]}
              onPress={() => setSelectedFilter(status)}
            >
              <Text style={[styles.filterText, selectedFilter === status && styles.activeFilterText]}>
                {status.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tasks List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sprint Tasks ({filteredTasks.length})</Text>
          <Text style={styles.sectionHelp}>Tap card to advance status</Text>
        </View>

        {filteredTasks.map((item) => {
          const isDone = item.status === 'DONE';
          const priorityColors: Record<string, string> = {
            CRITICAL: '#F43F5E',
            HIGH: '#FB923C',
            MEDIUM: '#FBBF24',
            LOW: '#38BDF8',
          };

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.taskCard, isDone && styles.taskCardDone]}
              onPress={() => toggleTaskStatus(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.taskTopRow}>
                <Text style={styles.taskProjectTag}>{item.projectName}</Text>
                <View style={[styles.priorityBadge, { borderColor: priorityColors[item.priority] }]}>
                  <Text style={[styles.priorityText, { color: priorityColors[item.priority] }]}>
                    {item.priority}
                  </Text>
                </View>
              </View>

              <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>{item.title}</Text>
              <Text style={styles.taskDesc}>{item.description}</Text>

              <View style={styles.taskFooter}>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'DONE' && styles.statusDone,
                    item.status === 'IN_PROGRESS' && styles.statusInProgress,
                    item.status === 'IN_REVIEW' && styles.statusInReview,
                    item.status === 'TODO' && styles.statusTodo,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>{item.status.replace('_', ' ')}</Text>
                </View>
                <Text style={styles.actionHint}>Tap to switch →</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Release Artifacts Section */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.four }]}>
          <Text style={styles.sectionTitle}>Mobile Releases (.APK)</Text>
        </View>

        {releases.map((rel) => (
          <View key={rel.id} style={styles.releaseCard}>
            <View style={styles.releaseTop}>
              <View>
                <Text style={styles.releaseVersion}>{rel.version}</Text>
                <Text style={styles.releaseMeta}>Android Package • {rel.fileSize}</Text>
              </View>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => Linking.openURL(rel.downloadUrl).catch(() => {})}
              >
                <Text style={styles.downloadButtonText}>Download APK</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.releaseNotes}>{rel.releaseNotes}</Text>
          </View>
        ))}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181822',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D2D3D',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  sprintCard: {
    backgroundColor: '#12121A',
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#262638',
    marginBottom: Spacing.three,
  },
  sprintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sprintTag: {
    fontSize: 10,
    color: '#9333EA',
    fontWeight: '800',
    letterSpacing: 1,
  },
  sprintTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  progressBadge: {
    backgroundColor: '#9333EA22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#9333EA66',
  },
  progressBadgeText: {
    color: '#C084FC',
    fontWeight: '700',
    fontSize: 13,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#262638',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#9333EA',
    borderRadius: 4,
  },
  sprintMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sprintMetaText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  boldText: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.three,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#12121A',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262638',
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  sectionHelp: {
    fontSize: 11,
    color: '#64748B',
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: Spacing.three,
  },
  chip: {
    backgroundColor: '#181824',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2D2D3D',
  },
  activeChip: {
    backgroundColor: '#9333EA',
    borderColor: '#A855F7',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#12121A',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262638',
    marginBottom: Spacing.three,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterButton: {
    backgroundColor: '#262638',
  },
  filterText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  activeFilterText: {
    color: '#C084FC',
  },
  taskCard: {
    backgroundColor: '#12121A',
    borderRadius: 14,
    padding: Spacing.three,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#262638',
  },
  taskCardDone: {
    opacity: 0.65,
    borderColor: '#1E293B',
  },
  taskTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskProjectTag: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  priorityBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  taskDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 10,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E1E2D',
    paddingTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#1E1E2D',
  },
  statusTodo: {
    backgroundColor: '#1E293B',
  },
  statusInProgress: {
    backgroundColor: '#1E3A8A',
  },
  statusInReview: {
    backgroundColor: '#78350F',
  },
  statusDone: {
    backgroundColor: '#064E3B',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  actionHint: {
    fontSize: 11,
    color: '#A855F7',
    fontWeight: '600',
  },
  releaseCard: {
    backgroundColor: '#12121A',
    borderRadius: 14,
    padding: Spacing.three,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#262638',
  },
  releaseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  releaseVersion: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  releaseMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  downloadButton: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  releaseNotes: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
});
