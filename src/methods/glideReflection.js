export const glideReflection = {
  id: 'glideReflection',
  name: 'Glide Reflection',
  category: 'Basic Symmetry Operations',
  description: 'Reflects the motif and translates it along the reflection axis',
  configSchema: [
    {
      key: 'glideDistance',
      label: 'Translation distance',
      type: 'range',
      default: 0.5,
      min: -10,
      max: 10,
      step: 0.01,
    },
    {
      key: 'reflectionDistance',
      label: 'Reflection distance',
      type: 'range',
      default: 1,
      min: -10,
      max: 10,
      step: 0.01,
    },
    {
      key: 'elementRotation',
      label: 'Element rotation',
      type: 'range',
      default: 0,
      min: -180,
      max: 180,
      step: 1,
    },
  ],
  getTransforms(config, tileW, tileH) {
    const refDist = config.reflectionDistance ?? 1;
    const glideDist = config.glideDistance ?? 0.5;
    const elemRot = config.elementRotation ?? 0;

    const cx = tileW / 2;
    const cy = tileH / 2;
    const rot = elemRot ? ` rotate(${elemRot}, ${cx}, ${cy})` : '';

    // Flip around motif center, then translate to final position
    return [
      { transform: rot.trim() || '' },
      {
        transform: `translate(${glideDist * tileW}, ${refDist * tileH}) translate(${cx}, ${cy}) scale(1, -1) translate(${-cx}, ${-cy})${rot}`,
      },
    ];
  },
  getGuideElements(config, tileW, tileH) {
    const glideDist = config.glideDistance ?? 0.5;
    const refDist = config.reflectionDistance ?? 1;
    const cx = tileW / 2;
    const cy = tileH / 2;

    const len = Math.max(tileW, tileH) * 0.3;
    const endX = cx + glideDist * tileW;
    const endY = cy + refDist * tileH;
    const midX = (cx + endX) / 2;
    const midY = (cy + endY) / 2;
    return [
      { type: 'arrow', x1: cx, y1: cy, x2: endX, y2: endY },
      { type: 'mirrorLine', x1: midX - len, y1: midY, x2: midX + len, y2: midY },
    ];
  },
};
