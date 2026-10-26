import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CATALOG } from './src/content/catalog';
import type { AgeBand } from './src/core/progress/types';
import { recommend } from './src/core/recommender';
import { SCENARIOS } from './src/dev/scenarios';

/**
 * TEMPORARY developer screen: shows what the recommender suggests for a few
 * fake play histories, and the sentences a parent would read. It replaces
 * the Expo template screen until the real screens exist (Phase 3), when this
 * file becomes a thin entry point for Expo Router.
 */

const AGE_BANDS: { id: AgeBand; label: string }[] = [
  { id: 'under-3', label: 'Under 3' },
  { id: '3-to-3.5', label: '3 to 3½' },
  { id: '3.5-plus', label: '3½ and up' },
];

/** Looks up an activity's title by ID, for display. */
const titleOf = (id: string) => CATALOG.find((a) => a.id === id)?.title ?? id;

export default function App() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [ageBand, setAgeBand] = useState<AgeBand>('3-to-3.5');
  // Captured once so the results don't shift while you tap around.
  const [now] = useState(() => Date.now());

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];

  // Re-run the recommender only when the scenario or age band changes.
  const result = useMemo(
    () => recommend({ catalog: CATALOG, sessions: scenario.build(now), ageBand, now }),
    [scenario, ageBand, now],
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          Recommender preview
        </Text>
        <Text style={styles.muted}>Developer screen. Fake play histories; nothing is stored.</Text>

        <Text style={styles.label}>Play history</Text>
        <View style={styles.chips}>
          {SCENARIOS.map((s) => (
            <Chip key={s.id} label={s.label} selected={s.id === scenarioId} onPress={() => setScenarioId(s.id)} />
          ))}
        </View>
        <Text style={styles.body}>{scenario.description}</Text>

        <Text style={styles.label}>Age band (sets the starting level)</Text>
        <View style={styles.chips}>
          {AGE_BANDS.map((b) => (
            <Chip key={b.id} label={b.label} selected={b.id === ageBand} onPress={() => setAgeBand(b.id)} />
          ))}
        </View>

        <Text style={styles.section}>Suggestions</Text>
        {result.suggestions.map((s, i) => (
          <View key={s.activityId} style={[styles.card, i === 0 && styles.cardHighlighted]}>
            <Text style={styles.cardTitle}>
              {i + 1}. {titleOf(s.activityId)}
            </Text>
            <Text style={styles.meta}>
              {i === 0 ? 'Highlighted on Home · ' : ''}
              {s.level} level · {s.reason}
            </Text>
            <Text style={styles.body}>{s.parentText}</Text>
          </View>
        ))}

        <Text style={styles.section}>Notes for the parent dashboard</Text>
        {result.notes.length === 0 ? (
          <Text style={styles.muted}>None.</Text>
        ) : (
          result.notes.map((n) => (
            <View key={n.activityId} style={styles.card}>
              <Text style={styles.cardTitle}>{titleOf(n.activityId)}</Text>
              <Text style={styles.meta}>{n.kind}</Text>
              <Text style={styles.body}>{n.parentText}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

/** A tappable option. `selected` drives both the look and what a screen reader announces. */
function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.chipPressed]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const colors = {
  background: '#FAF8F5',
  card: '#FFFFFF',
  text: '#1F2328',
  muted: '#5F6670',
  border: '#DDD8D0',
  accent: '#2F6FDB',
  accentSoft: '#EAF1FC',
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  // Fixed top padding keeps clear of the status bar; real screens will use safe-area insets.
  content: { paddingTop: 64, paddingHorizontal: 16, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginTop: 20, marginBottom: 8 },
  section: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 28, marginBottom: 8 },
  body: { fontSize: 15, lineHeight: 21, color: colors.text, marginTop: 4 },
  muted: { fontSize: 14, color: colors.muted, marginTop: 4 },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44, // comfortable tap target for an adult
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipPressed: { opacity: 0.7 },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  cardHighlighted: { borderColor: colors.accent, borderWidth: 2, backgroundColor: colors.accentSoft },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
});
