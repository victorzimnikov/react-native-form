import { deepUpdate, update } from "immupdate";
import { useEffect, useMemo, useReducer } from "react";
import { assign, isEmpty, isEqual, isPlainObject } from "lodash";

interface Dict<T> {
  readonly [key: string]: T;
}

enum Actions {
  Blur = "Form/Blur",
  Reset = "Form/Reset",
  Change = "Form/Change",
  SetError = "Form/SetError",
  ClearErrors = "Form/ClearErrors",
  ChangeValues = "Form/ChangeValues",
}

export interface ActionProps {
  readonly value?: any;
  readonly values?: any;
  readonly type: Actions;
  readonly field?: string;
}

export interface FormErrorProps {
  readonly field: string;
  readonly errorText: string;
}

export interface InputFormProps<V, E> {
  readonly error?: E;
  readonly fields: string[];
  readonly requiredFields?: string[];
  readonly initialValues?: Partial<V>;
  readonly onBlur?: (values: V) => void;
  readonly onChange?: (values: V) => void;
  readonly validate?: Dict<(values: V) => string>;
  readonly formatError?: (error: E) => FormErrorProps[];
}

export interface FormStateProps<V> {
  readonly values: V;
  readonly valid: boolean;
  readonly pristine: boolean;
  readonly errors: Dict<string>;
  readonly changeValues: (values: V) => void;
}

export interface FormProps<V> extends FormStateProps<V> {
  readonly reset: () => void;
  readonly blur: (field: string) => void;
  readonly change: (field: string, value: any) => void;
}

const baseFormProps: Partial<FormStateProps<any>> = {
  values: {},
  errors: {},
  valid: true,
  pristine: true,
};

function getInitialState(fields: string[], initialValues: object = {}): FormStateProps<any> {
  const x = fields.reduce(
    (acc, item: string) =>
      update(acc, {
        [item]: undefined,
      }),
    {},
  );

  const values = assign(x, initialValues);

  return assign(baseFormProps, { values });
}

function reducerWrapper(
  fields: string[],
  requiredFields: string[] = [],
  initialValues: any = {},
  logger?: (data: ActionProps) => void,
) {
  return (state: any, { type, field, value, values }: ActionProps) => {
    if (__DEV__ && logger) {
      logger({ type, field, value, values });
    }

    switch (type) {
      case Actions.ClearErrors:
        return update(state, { errors: {} });

      case Actions.Reset:
        return update(state, getInitialState(fields, initialValues));

      case Actions.Change: {
        if (!field) {
          return state;
        }

        const v = update(state.values, { [field]: value });
        const pristine = isEqual(v, initialValues);
        const errors = update(state.errors, { [field]: "" });

        const hasErrors = Object.values(errors).filter(x => Boolean(x)).length > 0;
        const filledRequired =
          fields.filter(x => (requiredFields.includes(x) ? Boolean(v[x]) : false)).length ===
          requiredFields.length;

        return update(state, {
          errors,
          pristine,
          values: v,
          valid: !hasErrors && filledRequired,
        });
      }

      case Actions.ChangeValues: {
        if (!values || !isPlainObject(values)) {
          return state;
        }

        return deepUpdate(state)
          .at("values")
          .modify(x => update(x, values));
      }

      case Actions.Blur:
      case Actions.SetError: {
        if (!field) {
          return state;
        }

        const errors = update(state.errors, { [field]: value });

        const hasErrors = Object.values(errors).filter(x => Boolean(x)).length > 0;
        const filledRequired =
          fields.filter(x => (requiredFields.includes(x) ? Boolean(state.values[x]) : false))
            .length === requiredFields.length;

        return update(state, { errors, valid: !hasErrors && filledRequired });
      }

      default:
        return state;
    }
  };
}

export function useForm<V = {}, E = Error>({
  error,
  validate,
  onChange,
  fields = [],
  formatError,
  initialValues,
  requiredFields,
}: InputFormProps<V, E>): FormProps<V> {
  const initialState = useMemo(() => getInitialState(fields, initialValues), []);
  const reducer = useMemo(() => reducerWrapper(fields, requiredFields, initialValues), []);

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (onChange) {
      onChange(state.values);
    }
  }, [state.values]);

  useEffect(() => {
    if (formatError) {
      const errors: FormErrorProps[] = formatError(error);

      if (isEmpty(errors)) {
        dispatch({ type: Actions.ClearErrors });
      }

      errors.forEach(({ field, errorText }) => {
        if (errorText && errorText !== "") {
          dispatch({ type: Actions.SetError, field, value: errorText });
        }
      });
    }
  }, [error]);

  return {
    ...state,
    reset: () => dispatch({ type: Actions.Reset }),
    changeValues: (values: Partial<V>) => dispatch({ type: Actions.Change, values }),
    change: (field: string, value: any) => dispatch({ type: Actions.Change, field, value }),
    blur: (field: string) => {
      const validator = validate && validate[field];

      if (validator) {
        dispatch({
          field,
          type: Actions.SetError,
          value: validator(state.values),
        });
      } else {
        dispatch({
          field,
          type: Actions.Blur,
        });
      }
    },
  };
}
