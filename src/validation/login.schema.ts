import * as yup from "yup";

import { emailField } from "./common";

/** Log in screen: any well-formed email and a non-empty password. */
export const loginSchema = yup.object({
  email: emailField(),
  password: yup.string().required("Password is required"),
});

export type ILogin = yup.InferType<typeof loginSchema>;
