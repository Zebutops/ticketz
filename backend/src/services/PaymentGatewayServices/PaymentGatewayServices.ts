// src/services/PaymentGatewayServices.ts
import AppError from "../../errors/AppError";
import GetSuperSettingService from "../SettingServices/GetSuperSettingService";
import { efiCheckStatus, efiCreateSubscription, efiInitialize, efiWebhook } from "./EfiServices";
import { owenCreateSubscription, owenWebhook } from "./OwenServices";
import { creditCardInitialize, creditCardCreateSubscription, creditCardWebhook } from "./CreditCardServices";
import { Request, Response } from "express";
import Invoices from "../../models/Invoices";
import { getIO } from "../../libs/socket";
import { Op } from "sequelize";
import Company from "../../models/Company";

export const payGatewayInitialize = async () => {
  const paymentGateway = await GetSuperSettingService({ key: "_paymentGateway" });

  switch (paymentGateway) {
    case "efi": {
      return efiInitialize();
    }
    case "owen": {
      return owenInitialize(); // Add the owenInitialize function if it exists
    }
    case "creditcard": {
      return creditCardInitialize();
    }
    default: {
      throw new AppError("Unsupported payment gateway", 400);
    }
  }
}

export const payGatewayCreateSubscription = async (req: Request, res: Response): Promise<Response> => {
  const paymentGateway = await GetSuperSettingService({ key: "_paymentGateway" });

  switch (paymentGateway) {
    case "efi": {
      return efiCreateSubscription(req, res);
    }
    case "owen": {
      return owenCreateSubscription(req, res);
    }
    case "creditcard": {
      return creditCardCreateSubscription(req, res);
    }
    default: {
      throw new AppError("Unsupported payment gateway", 400);
    }
  }
}

export const payGatewayReceiveWebhook = async (req: Request, res: Response): Promise<Response> => {
  const paymentGateway = await GetSuperSettingService({ key: "_paymentGateway" });

  switch (paymentGateway) {
    case "efi": {
      return efiWebhook(req, res);
    }
    case "owen": {
      return owenWebhook(req, res);
    }
    case "creditcard": {
      return creditCardWebhook(req, res);
    }
    default: {
      throw new AppError("Unsupported payment gateway", 400);
    }
  }
}
