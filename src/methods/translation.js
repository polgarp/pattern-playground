export const translation = {
  id: 'translation',
  name: 'Translation',
  category: 'Translation Symmetry',
  description: 'Repeats the motif offset by a distance',
  configSchema: [
    {
      key: 'dx',
      label: 'Horizontal Offset',
      type: 'range',
      default: 0.5,
      min: -1,
      max: 1,
      step: 0.01,
    },
    {
      key: 'dy',
      label: 'Vertical Offset',
      type: 'range',
      default: 0,
      min: -1,
      max: 1,
      step: 0.01,
    },
    {
      key: 'copies',
      label: 'Copies',
      type: 'range',
      default: 1,
      min: 1,
      max: 6,
      step: 1,
    },
  ],
  getTransforms(config, tileW, tileH) {
    const dx = config.dx ?? 0.5;
    const dy = config.dy ?? 0;
    const copies = config.copies ?? 1;

    const transforms = [{ transform: '' }];
    for (let i = 1; i <= copies; i++) {
      transforms.push({
        transform: `translate(${i * dx * tileW}, ${i * dy * tileH})`,
      });
    }
    return transforms;
  },
};
