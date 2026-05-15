import { Router } from "express";
import type {Request, Response} from "express";
import multer from "multer";
import FormData from "form-data";

import { quizClient } from "@/shared/clients/quiz.client";
import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";
import { criarProxyHandler } from "@/shared/middlewares/proxy.middleware";

const router = Router();
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

const montarFormData = (req: Request): FormData => {
  const form = new FormData();

  for (const key in req.body) {
    const valor = req.body[key];
    if (typeof valor === 'object' && valor !== null) {
      for (const subKey in valor) {
        form.append(`${key}[${subKey}]`, String(valor[subKey]));
      }
    } else {
      form.append(key, String(valor));
    }
  }

  if (req.file) {
    form.append("imagem", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
  }

  return form;
};

const tratarErroBff = (error: unknown, res: Response, acao: string) => {
  const err = error as { response?: { status?: number; data?: unknown } };
  const status = err.response?.status || 500;

  return res.status(status).json(
    err.response?.data || { erro: `Erro ao ${acao} questão no BFF.` }
  );
};

router.use(middlewareAutenticacao);

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

router.all(/.*/, criarProxyHandler(quizClient));

export { router as questoesRouter };