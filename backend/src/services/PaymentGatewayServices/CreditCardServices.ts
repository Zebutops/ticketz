// src/services/CreditCardServices.ts
import { Request, Response } from "express";
import axios from "axios";
import GetSuperSettingService from "../SettingServices/GetSuperSettingService";
import { logger } from "../../utils/logger";
import Invoices from "../../models/Invoices";
import Company from "../../models/Company";
import AppError from "../../errors/AppError";
import { processInvoicePaid } from "./PaymentGatewayServices";

const creditCardBaseURL = "https://api.creditcardprovider.com";

const getCreditCardOptions = async () => {
  return {
    api_key: await GetSuperSettingService({ key: "_creditCardApiKey" }),
    api_secret: await GetSuperSettingService({ key: "_creditCardApiSecret" })
  };
}

export const creditCardInitialize = async () => {
  const creditCardOptions = await getCreditCardOptions();
  // Initialize credit card provider with options
  // For example: setting up webhooks or authentication
}

export const creditCardWebhook = async (req: Request, res: Response): Promise<Response> => {
  const { data } = req.body;
  if (data.status === "APPROVED") {
    const { transactionId } = data;
    const invoice = await Invoices.findOne({
      where: {
        txId: transactionId,
        status: "open",
      },
      include: { model: Company, as: "company" }
    });

    if (!invoice || data.amount < invoice.value) {
      return res.json({ ok: true });
    }

    await processInvoicePaid(invoice);

    return res.json({ ok: true });
  }
  return res.json({ ok: true });
}

export const creditCardCreateSubscription = async (req: Request, res: Response): Promise<Response> => {
  const { price, invoiceId } = req.body;

  const config = {
    headers: {
      "Authorization": `Bearer ${await GetSuperSettingService({ key: "_creditCardApiKey" })}`
    },
    data: {
      amount: price.toFixed(2),
      currency: "BRL",
      description: `Invoice #${invoiceId}`,
      invoiceId: invoiceId
    }
  };

  try {
    const invoice = await Invoices.findByPk(invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    const response = await axios.post(`${creditCardBaseURL}/charge`, config);
    await invoice.update({
      txId: response.data.transactionId,
      payGw: "creditcard",
      payGwData: JSON.stringify(response.data)
    });

    return res.json({
      paymentLink: response.data.paymentLink,
      amount: { original: price }
    });
  } catch (error) {
    logger.error({ error }, "creditCardCreateSubscription error");
    throw new AppError("Problema encontrado, entre em contato com o suporte!", 400);
  }
};
