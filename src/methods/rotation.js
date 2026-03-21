export const rotation = {
  id: 'rotation',
  name: 'Rotation',
  category: 'Basic Symmetry Operations',
  description: 'Rotates the motif around a point with configurable order',
  configSchema: [
    {
      key: 'order',
      label: 'Order',
      type: 'range',
      default: 2,
      min: 2,
      max: 36,
      step: 1,
    },
    {
      key: 'distance',
      label: 'Distance',
      type: 'range',
      default: 1,
      min: 0,
      max: 10,
      step: 0.01,
    },
    {
      key: 'pointAngle',
      label: 'Point Angle',
      type: 'range',
      default: 0,
      min: 0,
      max: 359,
      step: 1,
    },
  ],
  getTransforms(config, tileW, tileH) {
    const order = config.order ?? 2;
    const distance = config.distance ?? 0;
    const pointAngle = config.pointAngle ?? 0;
    const angleStep = 360 / order;

    // Rotation point relative to tile
    const rad = (pointAngle * Math.PI) / 180;
    const cx = tileW / 2 + distance * (tileW / 2) * Math.cos(rad);
    const cy = tileH / 2 - distance * (tileH / 2) * Math.sin(rad);

    const transforms = [];
    for (let i = 0; i < order; i++) {
      const angle = i * angleStep;
      if (angle === 0) {
        transforms.push({ transform: '' });
      } else {
        // Rotate around (cx, cy): translate to origin, rotate, translate back
        transforms.push({
          transform: `translate(${cx}, ${cy}) rotate(${angle}) translate(${-cx}, ${-cy})`,
        });
      }
    }
    return transforms;
  },
};
