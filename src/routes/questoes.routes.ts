import { Router } from "express";
import type {Request, Response} from "express";
import multer from "multer";
import FormData from "form-data";

import { quizClient } from "@/shared/clients/quiz.client";
import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";
import { criarProxyHandler } from "@/shared/middlewares/proxy.middleware";

const router = Router();
// Upload de imagem da questao em memoria (nao grava em disco), com teto de 5MB e
// aceitando apenas formatos de imagem. O buffer e repassado adiante ao Quiz-Service.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const formatosPermitidos = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (formatosPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Formato inválido. Apenas imagens são permitidas."));
    }
  }
});

/**
 * Reconstroi um multipart/form-data para reenviar a questao ao Quiz-Service.
 *
 * Questoes combinam imagem e campos de texto, entao nao da para repassar como JSON
 * simples (motivo de esta rota nao usar o proxy comum). Campos aninhados viram
 * chaves no formato "campo[subcampo]" e o arquivo e anexado quando presente.
 *
 * @param req Requisicao Express com corpo e arquivo (multer) da questao.
 * @returns FormData pronto para envio ao Quiz-Service.
 */
const montarFormData = (req: Request): FormData => {
  const form = new FormData();

  for (const key in req.body) {
    const valor = req.body[key];
    // Campos aninhados (objeto) viram chaves no formato "campo[subcampo]".
    if (typeof valor === 'object' && valor !== null) {
      for (const subKey in valor) {
        form.append(`${key}[${subKey}]`, String(valor[subKey]));
      }
    } else {
      form.append(key, String(valor));
    }
  }

  // Anexa o arquivo de imagem, quando enviado, preservando nome e tipo originais.
  if (req.file) {
    form.append("imagem", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
  }

  return form;
};

/**
 * Trata erros das rotas de questao com upload, espelhando a resposta do Quiz.
 *
 * Repassa ao cliente o status e o corpo de erro vindos do Quiz-Service; se nao
 * houver resposta (ex.: falha de conexao), responde 500 generico citando a acao.
 *
 * @param error Erro capturado (tipicamente um AxiosError).
 * @param res Resposta Express a ser enviada ao cliente.
 * @param acao Rotulo da operacao em curso (ex.: "criar", "atualizar").
 * @returns A resposta Express ja finalizada.
 */
const tratarErroBff = (error: unknown, res: Response, acao: string) => {
  const err = error as { response?: { status?: number; data?: unknown } };
  const status = err.response?.status || 500;

  return res.status(status).json(
    err.response?.data || { erro: `Erro ao ${acao} questão no BFF.` }
  );
};

// Todas as rotas de questoes exigem usuario autenticado.
router.use(middlewareAutenticacao);

// POST cria questao com upload de imagem (multipart), por isso tem handler dedicado.
router.post("/", upload.single("imagem"), async (req, res) => {
  try {
    const form = montarFormData(req);

    const response = await quizClient.post("/api/v1/questoes", form.getBuffer(), {
      headers: {
        ...form.getHeaders(), 
        Authorization: req.headers.authorization, 
        "x-internal-token": process.env.INTERNAL_TOKEN || "",
      },
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    return tratarErroBff(error, res, "criar");
  }
});

// PUT atualiza questao existente, tambem com possivel troca de imagem.
router.put("/:id", upload.single("imagem"), async (req, res) => {
  try {
    const form = montarFormData(req);
    const { id } = req.params;

    const response = await quizClient.put(`/api/v1/questoes/${id}`, form.getBuffer(), {
      headers: {
        ...form.getHeaders(),
        Authorization: req.headers.authorization,
        "x-internal-token": process.env.INTERNAL_TOKEN || "",
      },
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    return tratarErroBff(error, res, "atualizar");
  }
});

// Demais metodos/rotas de questoes (GET, DELETE...) nao mexem em imagem: vao no proxy padrao.
router.all(/.*/, criarProxyHandler(quizClient));

export { router as questoesRouter };