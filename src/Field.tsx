import React, { ReactElement } from "react";

import { FormProps } from "./useForm";

export interface Props {
  readonly name: string;
  readonly form: FormProps<any>;
  readonly component: ReactElement<any>;
}

export function Field({ name, component, form }: Props) {
  return React.cloneElement(component, {
    value: form.values[name],
    error: form.errors[name],
    onBlur: () => form.blur(name),
    onChange: (value: any) => form.change(name, value),
  });
}
