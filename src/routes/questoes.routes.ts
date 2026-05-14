import { Router } from "express";
import multer from "multer";
import FormData from "form-data";

import { quizClient } from "@/shared/clients/quiz.client";
import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";
import { criarProxyHandler } from "@/shared/middlewares/proxy.middleware";

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.use(middlewareAutenticacao);

router.post("/", upload.single("imagem"), async (req, res) => {
  try {
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
    const response = await backendClient.post("/api/v1/questoes", form.getBuffer(), {
      headers: {
        ...form.getHeaders(), 
        Authorization: req.headers.authorization, 
        "x-internal-token": process.env.INTERNAL_TOKEN,
      },
    });

    return res.status(response.status).json(response.data);
  } catch (error: unknown) {
    const err = error as {
      response?: {
        status?: number;
        data?: unknown;
      };
    };

    const status = err.response?.status || 500;

    return res.status(status).json(
      err.response?.data || {
        erro: "Erro ao atualizar questão no BFF.",
      }
    );
  }
});

router.put("/:id", upload.single("imagem"), async (req, res) => {
  try {
    const { id } = req.params;
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

    const response = await backendClient.put(`/api/v1/questoes/${id}`, form.getBuffer(), {
      headers: {
        ...form.getHeaders(),
        Authorization: req.headers.authorization,
        "x-internal-token": process.env.INTERNAL_TOKEN || "",
      },
    });

    return res.status(response.status).json(response.data);
  } catch (error: unknown) {
    const err = error as {
      response?: {
        status?: number;
        data?: unknown;
      };
    };

    const status = err.response?.status || 500;

    return res.status(status).json(
      err.response?.data || {
        erro: "Erro ao atualizar questão no BFF.",
      }
    );
  }
});

router.all(/.*/, criarProxyHandler(quizClient));
>>>>>>> main

export { router as questoesRouter };