# AI RAG Knowledge Base Design

## 1. Goal

Build a stable, built-in artificial intelligence knowledge base for LearnGenie that improves classroom generation quality before any user upload exists.

The product behavior should be:

- When a user enters a question or study topic, the app searches the knowledge base first.
- If related knowledge exists, the app lists multiple knowledge documents as selectable PDF-style course materials.
- The user can preview a document or directly generate a classroom from it.
- If no knowledge matches, the app falls back to direct classroom generation from the user topic.
- If the user uploads a file, the app should still allow direct classroom generation from that file.
- Knowledge-base matches for uploaded files should be recommendations, not blockers.
- Uploaded materials can be ingested into a separate user-upload layer after generation.

This design prioritizes:

- Stable demo behavior
- Broad AI topic coverage
- Good classroom-generation inputs
- Clear user choice in the UI
- Incremental future evolution toward a stronger RAG system

## 2. Current State

### 2.1 Working UI flow

The current homepage already contains the intended high-level interaction:

- Topic input triggers `/api/knowledge/search` before classroom generation.
- PDF upload triggers PDF parsing, then `/api/knowledge/match-upload`.
- Search hits are rendered as selectable document cards.
- Document preview and “generate from this document” flows already exist.

Relevant files:

- `/app/page.tsx`
- `/components/knowledge/knowledge-search-results.tsx`
- `/components/knowledge/knowledge-doc-viewer.tsx`
- `/app/knowledge/[docId]/page.tsx`
- `/app/api/knowledge/search/route.ts`
- `/app/api/knowledge/match-upload/route.ts`
- `/app/api/knowledge/document/[docId]/route.ts`
- `/app/api/knowledge/document/[docId]/meta/route.ts`

### 2.2 Broken backend foundation

The current service layer in `/lib/knowledge-base/service.ts` expects a local retriever implementation at `@/rag/retriever`, but in the current workspace the `rag/` directory is deleted from the working tree and therefore the actual retrieval backbone is missing.

That means the current knowledge-base feature is conceptually wired but not operationally reliable.

### 2.3 Existing post-generation ingest hook

The generation-preview flow already attempts to ingest uploaded content after successful classroom generation through `/api/knowledge/ingest`. That is useful and should be preserved, but the ingest target must remain logically separate from the built-in AI knowledge base.

## 3. Product Decision

We will implement a layered knowledge base rather than a purely static document set or a full external-vector-platform architecture.

Recommended approach:

- Built-in core AI knowledge documents
- Built-in practice-oriented AI documents
- User-uploaded documents stored separately
- Unified retrieval across all layers
- Explicit source labeling in results

This balances stability, coverage, explanation quality, and near-term implementation cost.

## 4. Knowledge Base Content Model

### 4.1 Content layers

The built-in AI knowledge base will ship with three logical layers.

#### Layer A: Core Foundations

Purpose:

- Give the system strong conceptual grounding
- Support introductory and structured lessons

Coverage:

- What AI is and major subfields
- Machine learning basics
- Supervised learning
- Unsupervised learning
- Deep learning foundations
- Neural network basics
- Training, loss, optimization, regularization
- Evaluation metrics and generalization
- Data quality and feature basics

#### Layer B: Key Capability Areas

Purpose:

- Cover the major modern AI application and model families
- Support most classroom-generation queries users are likely to ask

Coverage:

- Natural language processing
- Computer vision
- Speech and audio AI
- Multimodal AI
- Large language models
- Prompt engineering
- Retrieval-augmented generation
- Agent systems
- Fine-tuning and adaptation
- Safety, alignment, and governance
- Inference optimization and deployment basics

#### Layer C: Practice and Engineering Topics

Purpose:

- Make results useful for hands-on classroom generation instead of only textbook summaries

Coverage:

- PyTorch workflow basics
- Hugging Face ecosystem overview
- Building a RAG pipeline
- Chunking and retrieval strategies
- Agent workflow design
- Model evaluation and benchmark design
- AI application architecture
- API serving and deployment
- Common engineering pitfalls
- Practical case-study style explanations

### 4.2 Future-ready layer reservation

The first implementation should reserve structure for later expansion into:

- Reinforcement learning
- Recommender systems
- Graph neural networks
- MLOps
- Data engineering for AI
- AI product design

The initial release does not need deep coverage here, but the taxonomy and metadata model should not block expansion.

## 5. Document Shape

Each knowledge document should be optimized for both retrieval and classroom generation.

Each record should include:

- `docId`
- `title`
- `course`
- `module`
- `summary`
- `keywords`
- `content`
- `sourceType`
- `sourceLabel`
- `difficulty`
- `recommendedTeachingGoals`
- `pdfPath`
- `createdAt`
- `updatedAt`

### 5.1 Source typing

We need stronger source distinctions than the current `seed | upload` split.

Recommended values:

- `core`
- `practice`
- `upload`

If minimizing change is more important than schema purity, the implementation may keep the stored enum as `seed | upload` and derive display labels from richer metadata, but the UI must still show three user-facing categories:

- `核心知识`
- `实战专题`
- `用户上传`

### 5.2 Content writing standard

Built-in documents should be:

- Written in Chinese
- Structured for teaching
- Dense enough to generate a useful classroom
- Not excessively long or encyclopedic
- Rich in terminology and practical phrases to improve retrieval

Each document should include:

- Concept explanation
- Key terms
- Typical workflow or mechanism
- Common misunderstandings
- Practical use cases
- When relevant, trade-offs and pitfalls

## 6. Retrieval Design

### 6.1 Retrieval strategy for this release

Do not depend on an external vector database for the first implementation.

Instead, implement a self-contained local retriever with:

- Document-level metadata loading
- Chunk generation from document content
- Token-based search over title, summary, keywords, and chunks
- Weighted scoring across title, keyword, and chunk relevance

This keeps the feature easy to run and demo in a local competition environment.

### 6.2 Index storage

Use the existing `rag/` root expected by `/lib/knowledge-base/constants.ts`.

Files:

- `rag/knowledge_base.json`
- `rag/uploaded-docs.json`
- `rag/index/index.json`
- `rag/index/metadata.json`
- `rag/pdfs/*.pdf`

### 6.3 Index build responsibilities

The retriever layer should support:

- Loading built-in documents
- Loading uploaded documents
- Ensuring PDF files exist
- Chunking documents
- Precomputing token sets
- Caching in memory
- Rebuilding on demand after ingest

### 6.4 Scoring model

Use a simple weighted scoring model:

- Strong weight for title match
- Medium weight for keyword match
- Medium/high weight for matching chunk overlap
- Light bonus for summary match
- Optional small bias for built-in documents over uploads when scores are very close

Returned results should preserve:

- Score
- Match reasons
- Top matched chunks
- Match origin such as title, keyword, or chunk

### 6.5 Why not embeddings yet

Embeddings are deferred because:

- The current codebase first needs a stable local baseline
- External dependency and operational complexity would increase
- Demo reliability matters more than theoretical retrieval sophistication right now

However, the index shape should allow a later extension with embeddings if desired.

## 7. Knowledge Content Sourcing

### 7.1 Primary sourcing strategy

Use a mixed-source authoring approach:

- Core conceptual knowledge is written as structured internal teaching content
- Practice-oriented sections incorporate summarized public material patterns
- Metadata can include a short reference trail for future transparency and maintenance

### 7.2 Content quality principles

The built-in base should feel broad and substantial, not sparse.

That means:

- Enough documents to cover most AI classroom prompts
- Enough specificity to improve generation quality
- Enough practical content to support engineering-focused lessons

But it should not become:

- A giant unstructured textbook
- A raw crawl dump
- A citation-heavy academic archive

### 7.3 Scope target

The initial built-in set should cover the majority of common AI education intents, especially:

- “什么是人工智能”
- “机器学习入门”
- “监督学习和无监督学习”
- “深度学习基础”
- “Transformer 和大模型”
- “RAG 是什么”
- “Agent 怎么工作”
- “计算机视觉基础”
- “NLP 基础”
- “多模态”
- “AI 应用开发”
- “模型评测”
- “部署与落地”

## 8. User Flows

### 8.1 Topic-only flow

1. User enters a topic or learning question.
2. Frontend calls `/api/knowledge/search`.
3. Backend returns best matches from built-in and uploaded knowledge.
4. If matches exceed threshold:
   - Show result cards
   - Allow PDF preview
   - Allow direct classroom generation from a selected document
5. If no match:
   - Continue to direct classroom generation from the topic

### 8.2 Upload flow

1. User uploads a PDF.
2. Frontend parses the file into text and images.
3. Frontend calls `/api/knowledge/match-upload`.
4. If similar documents are found:
   - Present them as recommendations
   - Still preserve the option to generate directly from the uploaded file
5. If no similar documents are found:
   - Generate directly from the uploaded file

Key product rule:

For uploads, knowledge matches are advisory only. They must not block the user from using their own file.

### 8.3 Post-generation ingest flow

1. If classroom generation succeeds from an uploaded file, the frontend may call `/api/knowledge/ingest`.
2. The uploaded document is stored in the upload layer.
3. Uploaded materials become searchable later.

This preserves useful user material without polluting the built-in curated knowledge layer.

## 9. Frontend Changes

### 9.1 Search result presentation

Keep the current result-card approach and improve it with:

- Source label badge
- Better summary formatting
- Clearer match reasons
- Stronger distinction between preview and generate actions

### 9.2 Upload match UX

Adjust the upload-match result state so it clearly offers two paths:

- `直接基于上传文件生成课堂`
- `改为基于知识库资料生成课堂`

The current fallback button behavior is already close, but the copy and intent should be made explicit.

### 9.3 Display labels

Each result card should show one of:

- `核心知识`
- `实战专题`
- `用户上传`

This distinction improves trust and selection quality.

## 10. Backend/API Changes

### 10.1 Routes to keep

Keep and strengthen:

- `/api/knowledge/search`
- `/api/knowledge/match-upload`
- `/api/knowledge/ingest`
- `/api/knowledge/document/[docId]`
- `/api/knowledge/document/[docId]/meta`

### 10.2 Service layer work

Refactor or rebuild `/lib/knowledge-base/service.ts` so it works against a real local retriever implementation.

### 10.3 Retriever layer work

Recreate the missing `rag/` implementation with:

- `rag/retriever.ts`
- knowledge document loading
- index build helpers
- search
- cache reset

If splitting into multiple files improves clarity, that is acceptable, but the public interface should remain simple for the service layer.

## 11. Data and Schema Decisions

### 11.1 Compatibility

Where possible, preserve compatibility with the existing service response shape so the UI changes stay focused.

### 11.2 Metadata additions

It is acceptable to extend the knowledge document schema with:

- `sourceLabel`
- `difficulty`
- `recommendedTeachingGoals`
- optional `references`

These fields improve future explainability without forcing immediate UI exposure everywhere.

### 11.3 Built-in vs upload separation

Built-in documents and uploaded documents must remain physically and logically separate in storage, even if they are merged at query time.

## 12. Testing and Verification

Add focused coverage for:

- Knowledge search returns matches for built-in AI topics
- Search falls back cleanly when no match exists
- Upload match returns recommendation plus direct-generation fallback path
- Document meta endpoint returns recommended requirement and full text
- Document PDF endpoint returns a PDF response
- Ingest avoids duplicate uploaded documents
- Retriever initialization works when `rag/` assets must be created

If time is limited, prioritize service and route tests over broad end-to-end tests.

## 13. Non-Goals for This Iteration

This release should not attempt:

- Real-time external crawling as a runtime dependency
- Full vector database integration
- Full citation UI with scholarly source rendering
- Automatic source ranking by external authority
- Complex admin tooling for knowledge-base maintenance

Those can be follow-up phases after the stable built-in version is working.

## 14. Implementation Scope Summary

This implementation should deliver:

- A rebuilt local knowledge retriever
- A broad built-in AI knowledge set
- Stable topic search before generation
- Upload recommendation without upload blocking
- PDF preview for knowledge documents
- Post-generation ingest for user uploads
- Basic tests and graceful fallback behavior

## 15. Risks and Mitigations

### Risk: content too shallow

Mitigation:

- Prefer fewer but richer documents over many hollow summaries
- Include both theory and practice in the built-in set

### Risk: retrieval quality too weak

Mitigation:

- Tune title/keyword/chunk weighting
- Ensure document keywords are manually strong, not only auto-extracted
- Add result reasons for debugging quality

### Risk: upload layer degrades search quality

Mitigation:

- Keep upload documents separately tagged
- Optionally bias curated knowledge slightly above uploads when scores are similar

### Risk: current working tree already removed older rag assets

Mitigation:

- Rebuild the retriever and assets from the current repository state
- Do not assume deleted historical files should be restored verbatim

## 16. Recommended Next Step

After this design is approved, create a concrete implementation plan covering:

- Retriever/data layer
- Built-in content seeding
- UI updates
- Tests

Then implement in that order so the feature becomes functional end to end as early as possible.
