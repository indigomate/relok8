import { createGoogle } from '@ai-sdk/google';
import { RAG } from '@convex-dev/rag';
import {
  defaultEmbeddingSettingsMiddleware,
  embedMany,
  wrapEmbeddingModel,
} from 'ai';
import { components, internal } from '../_generated/api';
import type { OnloKnowledgeRecord } from './onloRetrieval';

const ONLO_NAMESPACE = 'onlo-verified-knowledge-v1';
const EMBEDDING_DIMENSION = 768;

const google = createGoogle({
  apiKey: () => {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!key) throw new Error('Onlo semantic search is not configured');
    return key;
  },
});

const embeddingModel = wrapEmbeddingModel({
  model: google.embedding('gemini-embedding-001'),
  middleware: defaultEmbeddingSettingsMiddleware({
    settings: {
      providerOptions: {
        google: {
          outputDimensionality: EMBEDDING_DIMENSION,
          taskType: 'SEMANTIC_SIMILARITY',
        },
      },
    },
  }),
});

const rag = new RAG((components as any).rag, {
  textEmbeddingModel: embeddingModel,
  embeddingDimension: EMBEDDING_DIMENSION,
});

function articleText(article: OnloKnowledgeRecord): string {
  return [
    `English title: ${article.titleEn}`,
    `English guidance: ${article.answerEn}`,
    `Polski tytuł: ${article.titlePl}`,
    `Polskie wskazówki: ${article.answerPl}`,
    `Search terms: ${article.keywords.join(', ')}`,
  ].join('\n\n');
}

export async function syncOnloRag(ctx: any, records: OnloKnowledgeRecord[]) {
  const pending = records.filter((record) => record.active && (record.ragVersion !== record.version || !record.ragEntryId));
  if (!pending.length) return { changed: 0, tokens: 0 };

  const texts = pending.map(articleText);
  const embedded = await embedMany({
    model: embeddingModel,
    values: texts,
    maxParallelCalls: 2,
  });

  for (const [index, article] of pending.entries()) {
    const result = await rag.add(ctx, {
      namespace: ONLO_NAMESPACE,
      key: article.slug,
      title: `${article.titleEn} / ${article.titlePl}`,
      contentHash: `${article.slug}:v${article.version}`,
      chunks: [{
        text: texts[index],
        keywords: [article.titleEn, article.titlePl, ...article.keywords].join(' '),
        embedding: embedded.embeddings[index],
      }],
      metadata: {
        slug: article.slug,
        category: article.category,
        jurisdiction: article.jurisdiction,
        sourceUrl: article.sourceUrl || '',
        version: article.version,
      },
    });
    await ctx.runMutation((internal as any).onloKnowledge.markRagSynced, {
      slug: article.slug,
      version: article.version,
      entryId: String(result.entryId),
    });
    if (result.replacedEntry) await rag.delete(ctx, { entryId: result.replacedEntry.entryId });
  }

  return { changed: pending.length, tokens: embedded.usage.tokens };
}

export async function semanticKnowledgeSlugs(ctx: any, question: string, records: OnloKnowledgeRecord[]): Promise<string[]> {
  await syncOnloRag(ctx, records);
  const result = await rag.search(ctx, {
    namespace: ONLO_NAMESPACE,
    query: question,
    searchType: 'vector',
    limit: 6,
    vectorScoreThreshold: 0.55,
  });
  return [...new Set(result.entries
    .map((entry) => entry.metadata?.slug)
    .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0))];
}
