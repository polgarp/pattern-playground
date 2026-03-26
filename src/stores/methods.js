import { writable, derived, get } from 'svelte/store';

export const methodRegistry = writable([]);

// Operation chain: array of { methodId: string, config: {} }
export const operationChain = writable([]);

export const MAX_OPERATIONS = 8;

export const methodRegistryMap = derived(
  [methodRegistry],
  ([$registry]) => new Map($registry.map(m => [m.id, m]))
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

export function addOperation(methodId) {
  operationChain.update(chain => {
    if (chain.length >= MAX_OPERATIONS) return chain;
    const method = get(methodRegistryMap).get(methodId);
    return [...chain, { methodId, config: getDefaultConfig(method), enabled: true }];
  });
}

export function removeOperation(index) {
  operationChain.update(chain => chain.filter((_, i) => i !== index));
}

export function setOperationMethod(index, methodId) {
  operationChain.update(chain => {
    const newChain = [...chain];
    const method = get(methodRegistryMap).get(methodId);
    newChain[index] = { methodId, config: getDefaultConfig(method) };
    return newChain;
  });
}

export function moveOperation(fromIndex, toIndex) {
  operationChain.update(chain => {
    const newChain = [...chain];
    const [item] = newChain.splice(fromIndex, 1);
    newChain.splice(toIndex, 0, item);
    return newChain;
  });
}

export function toggleOperationEnabled(index) {
  operationChain.update(chain => {
    const newChain = [...chain];
    newChain[index] = { ...newChain[index], enabled: !(newChain[index].enabled ?? true) };
    return newChain;
  });
}

export function updateOperationConfig(index, key, value) {
  operationChain.update(chain => {
    const newChain = [...chain];
    newChain[index] = {
      ...newChain[index],
      config: { ...newChain[index].config, [key]: value },
    };
    return newChain;
  });
}
