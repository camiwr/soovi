// Serviço para tratar e padronizar mensagens recebidas da API

export type MessageType = "success" | "error" | "warning" | "info";

export interface Message {
  type: MessageType;
  title?: string;
  content: string;
}

const defaultMessages: Record<string, Message> = {
  GENERIC_ERROR: {
    type: "error",
    title: "Erro",
    content: "Algo deu errado. Por favor, tente novamente mais tarde.",
  },
  SUCCESS_OPERATION: {
    type: "success",
    title: "Sucesso",
    content: "Operação realizada com sucesso!",
  },
};

export const MessageService = {
  formatMessage(apiMessage: string): Message {
    // Verifica se a mensagem da API está mapeada
    if (defaultMessages[apiMessage]) {
      return defaultMessages[apiMessage];
    }

    // Retorna uma mensagem genérica se não estiver mapeada
    return {
      type: "info",
      content: apiMessage,
    };
  },
};