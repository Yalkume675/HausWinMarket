// SEARCH + FILTER FORM (Lab 5): controlled inputs, the right keyboards,
// KeyboardAvoidingView, validation on blur/submit (not every keystroke),
// and results rendered with the tri-state pattern.

import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';

import { ErrorFace, errorToFace } from '@/api/errors';
import {
    Category,
    getCategories,
    Product,
    searchProducts,
} from '@/api/products';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/theme/ThemeProvider';

type SortBy = 'relevance' | 'price-asc' | 'price-desc' | 'rating';

const SORTS: { value: SortBy; label: string }[] = [
  { value: 'relevance', label: 'Best match' },
  { value: 'price-asc', label: 'Price ↑' },
  { value: 'price-desc', label: 'Price ↓' },
  { value: 'rating', label: 'Top rated' },
];

type Results =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: ErrorFace }
  | { status: 'ok'; data: Product[] };

export default function SearchScreen() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const columns = width >= 768 ? 3 : 2;
  const cardWidth =
    (width - theme.spacing.s * 2 * (columns + 1)) / columns;

  // Form state: every input is controlled.
  const [query, setQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('relevance');
  const [priceError, setPriceError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<Results>({
    status: 'idle',
  });

  useEffect(() => {
    getCategories()
      .then((list) => setCategories(list.slice(0, 12)))
      .catch(() => setCategories([]));
  }, []);

  const validatePrice = (value: string) => {
    if (!value.trim()) return null;

    const n = Number(value.replace(',', '.'));

    if (!Number.isFinite(n) || n <= 0) {
      return 'Enter a price greater than 0, e.g. 50';
    }

    return null;
  };

  const runSearch = async () => {
    const pErr = validatePrice(maxPrice);
    setPriceError(pErr);

    if (!query.trim() && !category) {
      setFormError('Type something to search for, or pick a category.');
      return;
    }

    setFormError(null);

    if (pErr) return;

    Keyboard.dismiss();
    setResults({ status: 'loading' });

    try {
      let data = await searchProducts(query.trim(), category);

      const limit = maxPrice.trim()
        ? Number(maxPrice.replace(',', '.'))
        : null;

      if (limit) {
        data = data.filter((p) => p.price <= limit);
      }

      if (sortBy === 'price-asc') {
        data = [...data].sort((a, b) => a.price - b.price);
      }

      if (sortBy === 'price-desc') {
        data = [...data].sort((a, b) => b.price - a.price);
      }

      if (sortBy === 'rating') {
        data = [...data].sort((a, b) => b.rating - a.rating);
      }

      setResults({ status: 'ok', data });
    } catch (error) {
      setResults({
        status: 'error',
        error: errorToFace(error),
      });
    }
  };

  const clearAll = () => {
    setQuery('');
    setMaxPrice('');
    setCategory(null);
    setSortBy('relevance');
    setPriceError(null);
    setFormError(null);
    setResults({ status: 'idle' });
  };

  const chip = (selected: boolean) => [
    styles.chip,
    {
      minHeight: theme.touch.min - theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      borderRadius: theme.radius.pill,
      borderColor: selected
        ? theme.colors.primary
        : theme.colors.border,
      backgroundColor: selected
        ? theme.colors.primary
        : theme.colors.surface,
    },
  ];

  const form = (
    <View
      style={{
        padding: theme.spacing.m,
        gap: theme.spacing.m,
      }}
    >
      <TextField
        label="What are you looking for?"
        value={query}
        onChangeText={setQuery}
        placeholder="e.g. phone, lipstick, kiwi"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={runSearch}
        error={formError}
      />

      <View style={{ gap: theme.spacing.s }}>
        <AppText variant="small" bold>
          Category
        </AppText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: theme.spacing.s }}
        >
          {[{ slug: '', name: 'All' }, ...categories].map((c) => {
            const selected = (c.slug || null) === category;

            return (
              <Pressable
                key={c.slug || 'all'}
                onPress={() => setCategory(c.slug || null)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Category ${c.name}`}
                hitSlop={4}
                style={chip(selected)}
              >
                <AppText
                  variant="small"
                  color={
                    selected
                      ? theme.colors.onPrimary
                      : theme.colors.text
                  }
                >
                  {c.name}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <TextField
        label="Maximum price (K)"
        value={maxPrice}
        onChangeText={(v) => {
          setMaxPrice(v);

          if (priceError) {
            setPriceError(validatePrice(v));
          }
        }}
        onBlur={() => setPriceError(validatePrice(maxPrice))}
        placeholder="Any price"
        keyboardType="decimal-pad"
        returnKeyType="done"
        error={priceError}
        helper="Leave empty for any price"
      />

      <View style={{ gap: theme.spacing.s }}>
        <AppText variant="small" bold>
          Sort by
        </AppText>

        <View
          style={[
            styles.wrap,
            { gap: theme.spacing.s },
          ]}
        >
          {SORTS.map((s) => (
            <Pressable
              key={s.value}
              onPress={() => setSortBy(s.value)}
              accessibilityRole="radio"
              accessibilityState={{
                selected: sortBy === s.value,
              }}
              hitSlop={4}
              style={chip(sortBy === s.value)}
            >
              <AppText
                variant="small"
                color={
                  sortBy === s.value
                    ? theme.colors.onPrimary
                    : theme.colors.text
                }
              >
                {s.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      <View
        style={[
          styles.row,
          { gap: theme.spacing.s },
        ]}
      >
        <View style={styles.flex}>
          <Button
            label="Search"
            icon="search"
            onPress={runSearch}
            busy={results.status === 'loading'}
            busyLabel="Searching…"
          />
        </View>

        <Button
          label="Clear"
          variant="secondary"
          onPress={clearAll}
          fullWidth={false}
        />
      </View>

      {results.status === 'ok' ? (
        <AppText muted accessibilityLiveRegion="polite">
          {results.data.length} result
          {results.data.length === 1 ? '' : 's'}
        </AppText>
      ) : null}
    </View>
  );

  return (
    // Keep inputs visible when the keyboard is open.
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        key={columns}
        data={results.status === 'ok' ? results.data : []}
        numColumns={columns}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => (
          <ProductCard product={item} width={cardWidth} />
        )}
        ListHeaderComponent={form}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: theme.spacing.s,
          paddingBottom: theme.spacing.xl,
        }}
        ListEmptyComponent={
          results.status === 'idle' ? (
            <EmptyState
              icon="search-outline"
              title="Find something good"
              message="Search by name or pick a category."
            />
          ) : results.status === 'loading' ? (
            <ActivityIndicator
              size="large"
              style={{ margin: theme.spacing.xl }}
              accessibilityLabel="Searching"
            />
          ) : results.status === 'error' ? (
            <ErrorState
              face={results.error}
              onRetry={runSearch}
            />
          ) : (
            <EmptyState
              icon="sad-outline"
              title="No matches"
              message="Try a different word, another category, or a higher maximum price."
            />
          )
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1.5,
    justifyContent: 'center',
  },
});