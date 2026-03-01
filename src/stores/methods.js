import { writable, derived } from 'svelte/store';

export const methodRegistry = writable([]);
export const selectedMethodId = writable(null);
export const methodConfig = writable({});

export const selectedMethod = derived(
  [methodRegistry, selectedMethodId],
  ([$registry, $id]) => $registry.find(m => m.id === $id) || null
);

export const methodCategories = derived(
  [methodRegistry],
  ([$registry]) => {
    const cats = {};
    for (const method of $registry) {
      if (!cats[method.category]) cats[method.category] = [];
      cats[method.category].push(method);
    }
    return cats;
  }
);

export function registerMethod(method) {
  methodRegistry.update(list => {
    if (list.find(m => m.id === method.id)) return list;
    return [...list, method];
  });
}

export function getDefaultConfig(method) {
  const config = {};
  if (!method?.configSchema) return config;
  for (const field of method.configSchema) {
    config[field.key] = field.default;
  }
  return config;
}
