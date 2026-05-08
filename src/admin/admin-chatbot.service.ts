import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { DataSource } from "typeorm";

type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

@Injectable()
export class AdminChatbotService {
  private readonly businessKeywords = [
    "pedido",
    "pedidos",
    "venta",
    "ventas",
    "ingreso",
    "ingresos",
    "producto",
    "productos",
    "stock",
    "inventario",
    "categoria",
    "categorias",
    "repartidor",
    "repartidores",
    "delivery",
    "cocina",
    "cliente",
    "clientes",
    "ciudad",
    "ciudades",
    "local",
    "locales",
    "admin",
    "pop2go",
    "metodo de pago",
    "estado",
    "flujo",
    "dashboard",
    "rentable",
    "rentabilidad",
    "factura",
    "facturacion",
    "facturar",
    "mes",
    "hoy",
    "vendi",
    "vendio",
    "vendimos",
    "vendido",
  ];

  constructor(private readonly dataSource: DataSource) {}

  async ask(question: string, userRoles: string[], userCityId?: number) {
    const normalizedQuestion = question.trim();
    const isSuperAdmin = userRoles.includes("superadmin");
    const quickAnswer = await this.tryAnswerWithoutLlm(
      normalizedQuestion,
      isSuperAdmin,
      userCityId,
    );

    if (quickAnswer) {
      return { answer: quickAnswer, restricted: false };
    }

    const hasBusinessIntent = this.isBusinessQuestion(normalizedQuestion);

    if (!hasBusinessIntent) {
      return {
        answer:
          "Solo puedo responder sobre la operacion de Pop2Go (pedidos, ventas, productos, stock, repartidores, ciudades y flujo del negocio). Reformula tu pregunta dentro de ese alcance.",
        restricted: true,
      };
    }

    const ragContext = await this.buildRagContext(isSuperAdmin, userCityId);
    let answer: string;
    try {
      answer = await this.askLlm(normalizedQuestion, ragContext);
    } catch (error: any) {
      const isRateLimited = error?.statusCode === 429;
      if (isRateLimited) {
        const fallback = await this.tryAnswerWithoutLlm(
          normalizedQuestion,
          isSuperAdmin,
          userCityId,
        );
        if (fallback) return { answer: fallback, restricted: false };
        return {
          answer:
            "Ahora mismo el proveedor de IA esta con alta demanda. Intenta de nuevo en unos segundos. Mientras tanto, puedes hacer preguntas mas cortas o usar un modelo de respaldo en OPENROUTER_FALLBACK_MODELS.",
          restricted: false,
        };
      }
      throw error;
    }

    return {
      answer,
      restricted: false,
    };
  }

  private isBusinessQuestion(question: string) {
    const lowered = question.toLowerCase();
    // Saludos cortos: responder sin bloquear (pero guiando al alcance)
    if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches)\b/.test(lowered)) {
      return true;
    }
    return this.businessKeywords.some((keyword) => lowered.includes(keyword));
  }

  private async tryAnswerWithoutLlm(
    question: string,
    isSuperAdmin: boolean,
    userCityId?: number,
  ): Promise<string | null> {
    const q = question.toLowerCase().trim();

    // Saludos
    if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches)\b/.test(q)) {
      return "Hola. Puedo ayudarte con pedidos, ventas, productos, stock y repartidores. Ejemplos: “¿Cuánto vendimos hoy?”, “Top 5 productos más vendidos”, “Stock bajo”.";
    }

    // Top productos
    if (
      /(top|mas vendidos|más vendidos|productos.*vendidos|vendidos.*productos)/.test(
        q,
      )
    ) {
      const rows = await this.getTopProducts(isSuperAdmin, userCityId);
      if (!rows?.length) return "No encontré ventas para calcular los productos más vendidos.";
      const lines = rows.map(
        (r: any, idx: number) =>
          `${idx + 1}. ${r.nombre} — ${r.unidades_vendidas} uds — $${this.formatMoney(
            r.ingresos,
          )}`,
      );
      return `Top 5 productos más vendidos:\n${lines.join("\n")}`;
    }

    // Stock bajo
    if (/stock bajo|bajo stock|poco stock|sin stock|inventario bajo/.test(q)) {
      const rows = await this.getLowStockProducts(isSuperAdmin, userCityId);
      if (!rows?.length) return "No encontré productos con stock bajo (<= 5) en este momento.";
      const lines = rows.map(
        (r: any) => `- ${r.nombre} (${r.local}): stock ${r.stock}`,
      );
      return `Productos con stock bajo (<= 5):\n${lines.join("\n")}`;
    }

    // Ventas / ingresos
    if (
      /cuanto vendi|cuánto vendí|cuanto vendimos|cuánto vendimos|ventas|ingresos|facturacion|facturación/.test(
        q,
      )
    ) {
      const stats = await this.getGeneralStats(isSuperAdmin, userCityId);
      const todayOrders = stats?.today_orders ?? 0;
      const isToday =
        /\bhoy\b|de hoy|del dia|del día|hoy\?/.test(q) ||
        /cuanto vendimos hoy|cuánto vendimos hoy|cuanto vendi hoy|cuánto vendí hoy/.test(
          q,
        );
      const isMonth = /\bmes\b|este mes|del mes/.test(q);
      const wantsTotal = /\btotal\b|historico|histórico|acumulado/.test(q);

      const todayDeliveredRevenue = stats?.today_delivered_revenue ?? 0;
      const monthDeliveredRevenue = stats?.month_delivered_revenue ?? 0;
      const totalRevenue = stats?.total_revenue ?? 0;

      if (isToday) {
        return `Ventas de hoy (entregados):\n- Pedidos creados hoy: ${todayOrders}\n- Ingresos por pedidos entregados hoy: $${this.formatMoney(todayDeliveredRevenue)}`;
      }

      if (isMonth) {
        return `Ventas del mes (entregados):\n- Ingresos por pedidos entregados este mes: $${this.formatMoney(monthDeliveredRevenue)}`;
      }

      if (wantsTotal) {
        return `Ventas totales (entregados):\n- Ingresos acumulados por pedidos entregados: $${this.formatMoney(totalRevenue)}`;
      }

      return `Resumen de ventas:\n- Hoy entregados: $${this.formatMoney(todayDeliveredRevenue)}\n- Mes entregados: $${this.formatMoney(monthDeliveredRevenue)}\n- Total entregados: $${this.formatMoney(totalRevenue)}`;
    }

    // Repartidores
    if (/repartidor|repartidores|deliverys|deliveries|mensajero/.test(q)) {
      const rows = await this.getDeliveriesStats(isSuperAdmin, userCityId);
      const approved =
        rows.find((r: any) => r.delivery_status === "approved")?.total ?? 0;
      const pending =
        rows.find((r: any) => r.delivery_status === "pending")?.total ?? 0;
      const rejected =
        rows.find((r: any) => r.delivery_status === "rejected")?.total ?? 0;
      const total = rows.reduce((sum: number, r: any) => sum + (r.total ?? 0), 0);
      return `Repartidores:\n- Total: ${total}\n- Aprobados: ${approved}\n- Pendientes: ${pending}\n- Rechazados: ${rejected}`;
    }

    // Pedidos por estado
    if (/por estado|estados|flujo|como va el flujo/.test(q)) {
      const rows = await this.getOrdersByStatus(isSuperAdmin, userCityId);
      if (!rows?.length) return "No encontré pedidos para agrupar por estado.";
      const lines = rows.map((r: any) => `- ${r.estado}: ${r.total}`);
      return `Pedidos por estado:\n${lines.join("\n")}`;
    }

    return null;
  }

  private formatMoney(value: unknown) {
    const n = typeof value === "number" ? value : parseFloat(String(value ?? 0));
    if (!Number.isFinite(n)) return "0";
    // COP-like formatting without decimals
    return Math.round(n).toLocaleString("es-CO");
  }

  private async buildRagContext(isSuperAdmin: boolean, userCityId?: number) {
    const scope = isSuperAdmin
      ? "superadmin (todas las ciudades)"
      : `admin (ciudad ${userCityId ?? "no definida"})`;

    const [generalStats, ordersByStatus, topProducts, lowStockProducts] =
      await Promise.all([
        this.getGeneralStats(isSuperAdmin, userCityId),
        this.getOrdersByStatus(isSuperAdmin, userCityId),
        this.getTopProducts(isSuperAdmin, userCityId),
        this.getLowStockProducts(isSuperAdmin, userCityId),
      ]);

    const businessRules = [
      "El asistente SOLO responde sobre Pop2Go y su logica de negocio.",
      "Flujo esperado de pedidos: nuevo -> preparando -> asignado -> listo_para_recoger -> recogido -> en_camino -> entregado.",
      "Tambien puede existir el estado legacy pendiente, que equivale a nuevo.",
      "Los pedidos pueden terminar en cancelado.",
      "No debe inventar datos. Si falta informacion, debe decirlo claramente.",
      "Debe priorizar respuestas accionables para administracion.",
    ].join("\n");

    return `
SCOPE:
${scope}

BUSINESS_RULES:
${businessRules}

RAG_DATA:
GeneralStats=${JSON.stringify(generalStats)}
OrdersByStatus=${JSON.stringify(ordersByStatus)}
TopProducts=${JSON.stringify(topProducts)}
LowStockProducts=${JSON.stringify(lowStockProducts)}
`.trim();
  }

  private async getGeneralStats(isSuperAdmin: boolean, userCityId?: number) {
    const params: Array<number> = [];
    const cityFilterClause = isSuperAdmin
      ? ""
      : ` AND s.id_ciudad = $${params.push(userCityId ?? 0)} `;
    const usersCityFilterClause = isSuperAdmin
      ? ""
      : ` AND u.id_ciudad = $${params.push(userCityId ?? 0)} `;
    const productsByCitySubquery = isSuperAdmin
      ? "(SELECT COUNT(*)::int FROM tbl_productos p WHERE p.activo = true)"
      : `(
          SELECT COUNT(DISTINCT p.id_producto)::int
          FROM tbl_productos p
          INNER JOIN tbl_stock_local sl ON sl.id_producto = p.id_producto
          INNER JOIN tbl_locales s ON s.id_local = sl.id_local
          WHERE p.activo = true
            AND sl.activo = true
            AND s.id_ciudad = $${params.push(userCityId ?? 0)}
        )`;

    const query = `
      WITH filtered_orders AS (
        SELECT o.*
        FROM tbl_pedidos o
        INNER JOIN tbl_direcciones a ON a.id_direccion = o.id_direccion
        INNER JOIN tbl_locales s ON s.id_local = a.id_local
        WHERE 1=1
        ${cityFilterClause}
      ),
      filtered_users AS (
        SELECT u.id_usuario, u.delivery_status
        FROM tbl_usuarios u
        WHERE 1=1
        ${usersCityFilterClause}
      )
      SELECT
        (SELECT COUNT(*)::int FROM filtered_orders) AS total_orders,
        (SELECT COUNT(*)::int FROM filtered_orders WHERE DATE(fecha_pedido) = CURRENT_DATE) AS today_orders,
        (SELECT COALESCE(SUM(total), 0)::numeric FROM filtered_orders WHERE estado = 'entregado') AS total_revenue,
        (SELECT COALESCE(SUM(total), 0)::numeric FROM filtered_orders WHERE estado = 'entregado' AND DATE(fecha_pedido) = CURRENT_DATE) AS today_delivered_revenue,
        (SELECT COALESCE(SUM(total), 0)::numeric FROM filtered_orders WHERE estado = 'entregado' AND date_trunc('month', fecha_pedido) = date_trunc('month', CURRENT_DATE)) AS month_delivered_revenue,
        (
          SELECT COUNT(DISTINCT fu.id_usuario)::int
          FROM filtered_users fu
          INNER JOIN tbl_usuario_roles ur ON ur.id_usuario = fu.id_usuario
          INNER JOIN tbl_roles r ON r.id_rol = ur.id_rol
          WHERE r.nombre = 'repartidor'
            AND fu.delivery_status = 'approved'
        ) AS active_deliveries,
        ${productsByCitySubquery} AS total_products
    `;

    const rows = await this.dataSource.query(query, params);
    return rows[0] ?? {};
  }

  private async getOrdersByStatus(isSuperAdmin: boolean, userCityId?: number) {
    const params: Array<number> = [];
    const cityFilterClause = isSuperAdmin
      ? ""
      : ` AND s.id_ciudad = $${params.push(userCityId ?? 0)} `;

    const query = `
      SELECT
        o.estado,
        COUNT(*)::int AS total
      FROM tbl_pedidos o
      INNER JOIN tbl_direcciones a ON a.id_direccion = o.id_direccion
      INNER JOIN tbl_locales s ON s.id_local = a.id_local
      WHERE 1=1
      ${cityFilterClause}
      GROUP BY o.estado
      ORDER BY total DESC
    `;

    return this.dataSource.query(query, params);
  }

  private async getTopProducts(isSuperAdmin: boolean, userCityId?: number) {
    const params: Array<number> = [];
    const cityFilterClause = isSuperAdmin
      ? ""
      : ` AND s.id_ciudad = $${params.push(userCityId ?? 0)} `;

    const query = `
      SELECT
        p.id_producto,
        p.nombre,
        COALESCE(SUM(ci.cantidad), 0)::int AS unidades_vendidas,
        COALESCE(SUM(ci.cantidad * ci.precio_unitario), 0)::numeric AS ingresos
      FROM tbl_carrito_productos ci
      INNER JOIN tbl_pedidos o ON o.id_pedido = ci.id_pedido
      INNER JOIN tbl_productos p ON p.id_producto = ci.id_producto
      INNER JOIN tbl_direcciones a ON a.id_direccion = o.id_direccion
      INNER JOIN tbl_locales s ON s.id_local = a.id_local
      WHERE o.estado IN ('entregado', 'en_camino', 'listo_para_recoger', 'recogido')
      ${cityFilterClause}
      GROUP BY p.id_producto, p.nombre
      ORDER BY unidades_vendidas DESC
      LIMIT 5
    `;

    return this.dataSource.query(query, params);
  }

  private async getLowStockProducts(isSuperAdmin: boolean, userCityId?: number) {
    const params: Array<number> = [];
    const cityFilterClause = isSuperAdmin
      ? ""
      : ` AND s.id_ciudad = $${params.push(userCityId ?? 0)} `;

    const query = `
      SELECT
        p.id_producto,
        p.nombre,
        sl.stock,
        s.nombre AS local
      FROM tbl_stock_local sl
      INNER JOIN tbl_productos p ON p.id_producto = sl.id_producto
      INNER JOIN tbl_locales s ON s.id_local = sl.id_local
      WHERE p.activo = true
        AND sl.activo = true
        AND sl.stock <= 5
      ${cityFilterClause}
      ORDER BY sl.stock ASC, p.nombre ASC
      LIMIT 10
    `;

    return this.dataSource.query(query, params);
  }

  private async getDeliveriesStats(isSuperAdmin: boolean, userCityId?: number) {
    const params: Array<number> = [];
    const cityClause = isSuperAdmin
      ? ""
      : ` AND u.id_ciudad = $${params.push(userCityId ?? 0)} `;

    const query = `
      SELECT
        u.delivery_status,
        COUNT(*)::int AS total
      FROM tbl_usuarios u
      INNER JOIN tbl_usuario_roles ur ON ur.id_usuario = u.id_usuario
      INNER JOIN tbl_roles r ON r.id_rol = ur.id_rol
      WHERE r.nombre = 'repartidor'
      ${cityClause}
      GROUP BY u.delivery_status
      ORDER BY total DESC
    `;

    return this.dataSource.query(query, params);
  }

  private async askOpenRouter(question: string, ragContext: string) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const primaryModel =
      process.env.OPENROUTER_MODEL ||
      "meta-llama/llama-3.2-3b-instruct:free";
    const fallbackModels =
      process.env.OPENROUTER_FALLBACK_MODELS
        ?.split(",")
        .map((value) => value.trim())
        .filter(Boolean) ?? [];
    const modelsToTry = [primaryModel, ...fallbackModels];
    const appUrl = process.env.OPENROUTER_APP_URL || "http://localhost:3000";
    const appName = process.env.OPENROUTER_APP_NAME || "Pop2Go Admin Chatbot";

    if (!apiKey) {
      throw new InternalServerErrorException(
        "Falta OPENROUTER_API_KEY en variables de entorno",
      );
    }

    const messages: LlmMessage[] = [
      {
        role: "system",
        content: [
          "Eres un asistente de administracion de Pop2Go.",
          "Debes responder SOLO temas de logica de negocio y operacion de Pop2Go.",
          "Si la pregunta no es de negocio, rechaza con una frase breve.",
          "No inventes datos ni respuestas. Usa unicamente el contexto RAG entregado.",
          "Si faltan datos, indicalo y sugiere que dato faltaria.",
          "Responde en espanol, claro y accionable para admins.",
        ].join(" "),
      },
      {
        role: "user",
        content: `PREGUNTA_ADMIN: ${question}\n\nCONTEXTO_RAG:\n${ragContext}`,
      },
    ];

    const errors: Array<{ model: string; status: number; raw: string }> = [];

    for (const model of modelsToTry) {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": appUrl,
            "X-Title": appName,
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            max_tokens: 450,
            messages,
          }),
        },
      );

      if (!response.ok) {
        const rawError = await response.text();
        errors.push({ model, status: response.status, raw: rawError });

        // Errores recuperables: intentamos siguiente fallback
        // - 429: rate limit
        // - 404: modelo/slug no disponible (comun en modelos :free)
        // - 5xx: proveedor inestable
        if (
          response.status === 429 ||
          response.status === 404 ||
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504
        ) {
          continue;
        }

        // Para errores no recuperables, salimos de inmediato.
        throw new InternalServerErrorException(
          `OpenRouter error (${model}): ${response.status}`,
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data?.choices?.[0]?.message?.content?.trim();

      if (content) {
        return content;
      }
    }

    const has429 = errors.some((entry) => entry.status === 429);
    if (has429) {
      const rateLimitError: any = new ServiceUnavailableException(
        "OpenRouter esta temporalmente saturado. Intenta nuevamente en unos segundos.",
      );
      rateLimitError.statusCode = 429;
      throw rateLimitError;
    }

    const has404 = errors.some((entry) => entry.status === 404);
    if (has404) {
      throw new InternalServerErrorException(
        "Uno o mas modelos configurados no estan disponibles en OpenRouter (404). Revisa OPENROUTER_MODEL / OPENROUTER_FALLBACK_MODELS.",
      );
    }

    throw new InternalServerErrorException(
      "OpenRouter no devolvio contenido para la respuesta",
    );
  }

  private async askLlm(question: string, ragContext: string) {
    const provider = (process.env.LLM_PROVIDER || "openrouter").toLowerCase();
    if (provider === "gemini") {
      return this.askGemini(question, ragContext);
    }
    return this.askOpenRouter(question, ragContext);
  }

  private async askGemini(question: string, ragContext: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const fallbackModels =
      process.env.GEMINI_FALLBACK_MODELS
        ?.split(",")
        .map((v) => v.trim())
        .filter(Boolean) ?? [];
    const modelsToTry = [primaryModel, ...fallbackModels];

    if (!apiKey) {
      throw new InternalServerErrorException(
        "Falta GEMINI_API_KEY en variables de entorno",
      );
    }

    const systemText = [
      "Eres un asistente de administracion de Pop2Go.",
      "Responde SOLO temas de logica de negocio y operacion de Pop2Go.",
      "No inventes datos: usa unicamente el contexto RAG.",
      "Si falta informacion, indicalo claramente.",
      "Responde en espanol, claro y accionable para admins.",
    ].join(" ");

    const userText = `PREGUNTA_ADMIN: ${question}\n\nCONTEXTO_RAG:\n${ragContext}`;

    const errors: Array<{ model: string; status: number; raw: string }> = [];

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemText }] },
          contents: [{ role: "user", parts: [{ text: userText }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 450,
          },
        }),
      });

      if (!response.ok) {
        const raw = await response.text();
        errors.push({ model, status: response.status, raw });

        // Recuperables: 404 (modelo no habilitado), 429/5xx (carga)
        if (
          response.status === 404 ||
          response.status === 429 ||
          response.status === 500 ||
          response.status === 503
        ) {
          continue;
        }

        throw new InternalServerErrorException(
          `Gemini error (${model}): ${response.status} ${raw}`,
        );
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };

      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((p) => p.text || "")
          .join("")
          .trim() || "";

      if (text) return text;
    }

    const hasCapacityIssue = errors.some(
      (e) => e.status === 429 || e.status === 503 || e.status === 500,
    );
    if (hasCapacityIssue) {
      const err: any = new ServiceUnavailableException(
        "Gemini esta temporalmente saturado. Intenta nuevamente en unos segundos.",
      );
      err.statusCode = 429;
      throw err;
    }

    const has404 = errors.some((e) => e.status === 404);
    if (has404) {
      throw new InternalServerErrorException(
        "El modelo Gemini configurado no esta disponible (404). Ajusta GEMINI_MODEL / GEMINI_FALLBACK_MODELS segun AI Studio.",
      );
    }

    throw new InternalServerErrorException(
      "Gemini no devolvio contenido para la respuesta",
    );
  }
}
