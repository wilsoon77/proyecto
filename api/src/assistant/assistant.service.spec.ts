import { AssistantService } from './assistant.service.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { GroqProvider } from './providers/groq.provider.js';
import { MistralProvider } from './providers/mistral.provider.js';
import { NvidiaProvider } from './providers/nvidia.provider.js';

describe('AssistantService Multi-Provider & Tool Calling', () => {
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

  let configValues: Record<string, string>;
  let config: { get: jest.Mock };
  let policy: { resolveContext: jest.Mock };
  let reads: { productInventory: jest.Mock; inventoryLookup: jest.Mock };
  let geminiProvider: GeminiProvider;
  let groqProvider: GroqProvider;
  let mistralProvider: MistralProvider;
  let nvidiaProvider: NvidiaProvider;
  let service: AssistantService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    configValues = {
      GEMINI_API_KEY: 'gemini-test-key',
      GEMINI_MODEL: 'gemini-2.5-flash',
      GROQ_API_KEY: 'groq-test-key',
      GROQ_MODEL: 'llama-3.3-70b-versatile',
      ASSISTANT_PROVIDER: 'auto',
      ASSISTANT_MAX_STEPS: '4',
      ASSISTANT_TIMEOUT_MS: '30000',
    };

    config = {
      get: jest.fn((key: string) => configValues[key]),
    };
    policy = {
      resolveContext: jest.fn().mockResolvedValue(context),
    };
    reads = {
      productInventory: jest.fn().mockResolvedValue({
        query: 'pan francés',
        items: [{ branchId: 1, branchName: 'Centro', productName: 'Pan francés', quantity: 24, reserved: 0, available: 24 }],
      }),
      inventoryLookup: jest.fn().mockResolvedValue({
        resourceType: 'product',
        query: 'pan francés',
        items: [{
          branchId: 1,
          branchName: 'Centro',
          productName: 'Pan francés',
          quantity: 24,
          reserved: 0,
          available: 24,
          expiredQuantity: 0,
          stockUnitLabel: 'unidades',
        }],
      }),
    };

    geminiProvider = new GeminiProvider(config as never);
    groqProvider = new GroqProvider(config as never);
    mistralProvider = new MistralProvider(config as never);
    nvidiaProvider = new NvidiaProvider(config as never);

    service = new AssistantService(
      config as never,
      policy as never,
      reads as never,
      geminiProvider,
      groqProvider,
      mistralProvider,
      nvidiaProvider,
    );

    fetchMock = jest.fn();
    globalThis.fetch = fetchMock as typeof fetch;
  });

  it('resuelve directamente una consulta de inventario con nombre de producto', async () => {
    const answer = await service.answer('owner-1', '¿Cuánto inventario hay de pan francés?');
    expect(answer).toContain('Pan francés');
    expect(answer).toContain('24 unidades disponibles');

    expect(policy.resolveContext).toHaveBeenCalledWith('owner-1');
    expect(reads.inventoryLookup).toHaveBeenCalledWith(context, { query: 'pan francés', branch: undefined, prefer: 'product' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('conmuta automáticamente a Groq si Gemini falla en una pregunta abierta', async () => {
    // 1. Primer llamada a Gemini falla con 429 Too Many Requests
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: 'Quota exceeded' } }), {
      status: 429,
      headers: { 'content-type': 'application/json' },
    }));

    // 2. Fallback a Groq: Groq responde con tool_call
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      choices: [{
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: 'call-inventory-groq',
            type: 'function',
            function: { name: 'productInventory', arguments: '{"productQuery":"pan francés"}' },
          }],
        },
      }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    // 3. Siguiente paso: Gemini vuelve a fallar o Groq continúa
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: 'Quota exceeded' } }), {
      status: 429,
      headers: { 'content-type': 'application/json' },
    }));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      choices: [{ message: { role: 'assistant', content: 'Hay 24 panes en Centro (vía Groq).' } }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    const answer = await service.answer('owner-1', '¿Puedes explicar qué datos operativos maneja el sistema?');
    expect(answer).toBe('Hay 24 panes en Centro (vía Groq).');
  });

  it('usa proveedor explícito cuando se define ASSISTANT_PROVIDER=groq', async () => {
    configValues.ASSISTANT_PROVIDER = 'groq';

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      choices: [{ message: { role: 'assistant', content: 'Respuesta directa de Groq.' } }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    const answer = await service.answer('owner-1', 'Hola');
    expect(answer).toBe('Respuesta directa de Groq.');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.groq.com/openai/v1/chat/completions');
  });

  it('lanza ServiceUnavailableException si no hay ningún proveedor configurado', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.MISTRAL_API_KEY;
    delete process.env.NVIDIA_API_KEY;
    configValues = {};

    await expect(service.answer('owner-1', 'Hola'))
      .rejects.toThrow('No hay ningún proveedor de IA configurado');
  });
});
