import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  GoogleGenerativeAI,
  Content,
  FunctionDeclarationsTool,
} from '@google/generative-ai';

@Injectable()
export class GeminiService implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  onModuleInit() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        '⚠️  GEMINI_API_KEY não definida — módulo de IA desabilitado.',
      );
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    this.logger.log(`🤖 Gemini inicializado — modelo: ${this.modelName}`);
  }

  get isAvailable(): boolean {
    return !!this.genAI;
  }

  /**
   * Gera uma resposta estruturada (JSON) a partir de um prompt.
   * Usado para a busca inteligente — extrai filtros de linguagem natural.
   */
  async generateStructuredOutput<T>(
    prompt: string,
    schema: Record<string, unknown>,
    systemInstruction?: string,
  ): Promise<T> {
    this.ensureAvailable();

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemInstruction || undefined,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema as any,
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return JSON.parse(text) as T;
  }

  /**
   * Chat com function calling.
   * O Gemini pode invocar funções definidas e o caller executa-as,
   * retornando o resultado para o modelo gerar a resposta final.
   */
  async chatWithFunctions(
    systemInstruction: string,
    history: Content[],
    userMessage: string,
    tools: FunctionDeclarationsTool[],
    functionExecutor: (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<unknown>,
  ): Promise<{ text: string; functionsCalled: string[] }> {
    this.ensureAvailable();

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction,
      tools,
    });

    const chat = model.startChat({ history });

    // Envia a mensagem do usuário
    let result = await chat.sendMessage(userMessage);
    let response = result.response;

    const functionsCalled: string[] = [];
    let iterations = 0;
    const maxIterations = 5;

    // Loop para processar function calls (pode haver múltiplas rodadas)
    while (iterations < maxIterations) {
      const candidate = response.candidates?.[0];
      if (!candidate) break;

      const functionCalls = candidate.content?.parts?.filter(
        (part) => part.functionCall,
      );

      if (!functionCalls || functionCalls.length === 0) break;

      // Executa cada function call e coleta os resultados
      const functionResponses: {
        functionResponse: { name: string; response: unknown };
      }[] = [];

      for (const part of functionCalls) {
        const call = part.functionCall!;
        const fnName = call.name;
        const fnArgs = (call.args as Record<string, unknown>) || {};

        this.logger.debug(
          `Function call: ${fnName}(${JSON.stringify(fnArgs)})`,
        );
        functionsCalled.push(fnName);

        try {
          const fnResult = await functionExecutor(fnName, fnArgs);
          functionResponses.push({
            functionResponse: {
              name: fnName,
              response: { result: fnResult },
            },
          });
        } catch (error) {
          functionResponses.push({
            functionResponse: {
              name: fnName,
              response: {
                error:
                  error instanceof Error ? error.message : 'Erro desconhecido',
              },
            },
          });
        }
      }

      // Envia os resultados das funções de volta ao modelo
      result = await chat.sendMessage(functionResponses.map((fr) => fr as any));
      response = result.response;

      iterations++;
    }

    const finalText =
      response.text() || 'Desculpe, não consegui processar sua solicitação.';

    return { text: finalText, functionsCalled };
  }

  private ensureAvailable(): void {
    if (!this.genAI) {
      throw new Error(
        'Gemini não está configurado. Defina GEMINI_API_KEY no .env.',
      );
    }
  }
}
