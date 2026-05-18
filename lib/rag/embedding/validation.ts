/**
 * Embedding batch validation — ensures all vectors are finite, non-null,
 * and dimension-consistent. Patterned after DeepTutor's validation.py.
 */

import { createLogger } from '@/lib/logger';

const log = createLogger('EmbeddingValidation');

export function validateEmbeddingBatch(
  embeddings: number[][],
  expectedCount: number,
  binding: string,
  model: string,
  batchIndex?: number,
  totalBatches?: number,
): void {
  const ctx = batchIndex && totalBatches ? `batch ${batchIndex}/${totalBatches}` : 'batch';

  if (!Array.isArray(embeddings)) {
    throw new Error(`Embedding ${ctx}: expected array of vectors, got ${typeof embeddings}`);
  }

  if (embeddings.length !== expectedCount) {
    throw new Error(
      `Embedding ${ctx}: expected ${expectedCount} vectors, got ${embeddings.length} ` +
      `(binding=${binding}, model=${model})`,
    );
  }

  const expectedDim = embeddings[0]?.length ?? 0;
  if (expectedDim === 0) {
    throw new Error(
      `Embedding ${ctx}: first vector is empty (binding=${binding}, model=${model})`,
    );
  }

  for (let i = 0; i < embeddings.length; i++) {
    const vec = embeddings[i];
    if (!vec || vec.length !== expectedDim) {
      throw new Error(
        `Embedding ${ctx}: vector[${i}] has ${vec?.length ?? 0} dims, expected ${expectedDim} ` +
        `(binding=${binding}, model=${model})`,
      );
    }
    for (let j = 0; j < vec.length; j++) {
      const val = vec[j];
      if (val === null || val === undefined) {
        throw new Error(
          `Embedding ${ctx}: vector[${i}][${j}] is null/undefined ` +
          `(binding=${binding}, model=${model})`,
        );
      }
      if (!isFinite(val)) {
        throw new Error(
          `Embedding ${ctx}: vector[${i}][${j}]=${val} is not finite ` +
          `(binding=${binding}, model=${model})`,
        );
      }
    }
  }

  log.debug(`Validated ${ctx}: ${embeddings.length} vectors, dim=${expectedDim}`);
}
