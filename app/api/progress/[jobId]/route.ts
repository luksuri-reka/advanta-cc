// app/api/progress/[jobId]/route.ts
import { NextRequest } from 'next/server';

// In-memory store untuk progress (production gunakan Redis)
const progressStore = new Map<string, {
  currentBatch: number;
  totalBatches: number;
  totalInserted: number;
  totalRecords: number;
  status: 'processing' | 'completed' | 'error';
  error?: string;
}>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  
  // Setup SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );

      // Poll untuk progress updates
      const interval = setInterval(() => {
        const progress = progressStore.get(jobId);
        
        if (progress) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(progress)}\n\n`)
          );

          // Stop jika selesai atau error
          if (progress.status === 'completed' || progress.status === 'error') {
            clearInterval(interval);
            controller.close();
            
            // Cleanup setelah 5 detik
            setTimeout(() => {
              progressStore.delete(jobId);
            }, 5000);
          }
        }
      }, 100); // Update setiap 100ms

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Export helper untuk update progress dari actions
export function updateProgress(
  jobId: string,
  data: {
    currentBatch: number;
    totalBatches: number;
    totalInserted: number;
    totalRecords: number;
    status: 'processing' | 'completed' | 'error';
    error?: string;
  }
) {
  progressStore.set(jobId, data);
}

export function initProgress(
  jobId: string,
  totalBatches: number,
  totalRecords: number
) {
  progressStore.set(jobId, {
    currentBatch: 0,
    totalBatches,
    totalInserted: 0,
    totalRecords,
    status: 'processing',
  });
}