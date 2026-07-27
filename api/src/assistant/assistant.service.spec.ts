import { AssistantService } from './assistant.service.js';

describe('AssistantService Groq tool calling', () => {
  const context = {
    userId: 'owner-1',
    role: 'MANAGER' as const,
    firstName: 'Dueña',
    branches: [
      { id: 1, name: 'Centro', slug: 'centro' },
      { id: 2, name: 'Norte', slug: 'norte' },
    ],
    branchIds: [1, 2],
    timezone: 'America/Guatemala',
  };

  const configValues: Record<string, string> = {
    GROQ_API_KEY: 'groq-test-key',
    ASSISTANT_MODEL: 'openai/gpt-oss-120b',
    ASSISTANT_MAX_STEPS: '4',
    ASSISTANT_TIMEOUT_MS: '30000',
  };

  const config = {
    get: jest.fn((key: string) => configValues[key]),
  };
  const policy = {
    resolveContext: jest.fn().mockResolvedValue(context),
  };
  const reads = {
    salesSummary: jest.fn().mockResolvedValue({
      date: '2026-07-24',
      totalSales: 1250,
      orderCount: 14,
      branches: [
        { branchId: 1, branchName: 'Centro', totalSales: 700, orderCount: 8 },
        { branchId: 2, branchName: 'Norte', totalSales: 550, orderCount: 6 },
      ],
    }),
  };

  let service: AssistantService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AssistantService(config as never, policy as never, reads as never);
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock as typeof fetch;
  });

  it('ejecuta la tool local y entrega su resultado a Groq antes de responder', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [{
              id: 'call-sales',
              type: 'function',
              function: { name: 'salesSummary', arguments: '{}' },
            }],
          },
        }],
      }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{ message: { role: 'assistant', content: 'Hoy se vendieron Q1,250 en 14 pedidos.' } }],
      }), { status: 200, headers: { 'content-type': 'application/json' } }));

    await expect(service.answer('owner-1', '¿Cómo van las ventas hoy?'))
      .resolves.toBe('Hoy se vendieron Q1,250 en 14 pedidos.');

    expect(policy.resolveContext).toHaveBeenCalledWith('owner-1');
    expect(reads.salesSummary).toHaveBeenCalledWith(context, {});
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const secondRequest = fetchMock.mock.calls[1][1] as RequestInit;
    const secondBody = JSON.parse(String(secondRequest.body));
    expect(secondBody.messages.at(-1)).toEqual(expect.objectContaining({
      role: 'tool',
      tool_call_id: 'call-sales',
      name: 'salesSummary',
    }));
  });
});
