import { registerMethod } from '../stores/methods.js';
import { rotation } from './rotation.js';
import { translation } from './translation.js';
import { reflection } from './reflection.js';
import { glideReflection } from './glideReflection.js';

/**
 * Method module contract:
 * {
 *   id: string,
 *   name: string,
 *   category: string,
 *   description: string,
 *   configSchema: Array<{
 *     key: string,
 *     label: string,
 *     type: 'range' | 'select' | 'toggle' | 'number',
 *     default: any,
 *     min?: number, max?: number, step?: number,
 *     options?: Array<{ value: any, label: string }>,
 *   }>,
 *   // Returns an array of SVG transform objects to apply to copies of the motif
 *   // Each object: { transform: string } where transform is an SVG transform attribute
 *   getTransforms(config, tileWidth, tileHeight): Array<{ transform: string, clipPath?: string }>
 * }
 */

export function initMethods() {
  registerMethod(rotation);
  registerMethod(translation);
  registerMethod(reflection);
  registerMethod(glideReflection);
}
