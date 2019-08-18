import { update } from "immupdate";
import { assign, isEqual } from "lodash";
import { useEffect, useMemo, useReducer } from "react";

interface Dict<T> {
  readonly [key: string]: T;
}

enum Actions {
  Blur = "form/Blur",
  Reset = "form/Reset",
  Change = "form/Change",
  SetError = "form/SetError",
}

interface ActionProps {
  readonly value?: any;
  readonly type: Actions;
  readonly field?: string;
}

interface FormErrorProps {
  readonly field: string;
  readonly errorText: string;
}

interface InputFormProps<V, E> {
  readonly error?: E;
  readonly fields: string[];
  readonly initialValues?: Partial<V>;
  readonly onBlur?: (values: V) => void;
  readonly onChange?: (values: V) => void;
  readonly validate?: Dict<(values: V) => string>;
  readonly formatError?: (error: E) => FormErrorProps[];
}

interface FormStateProps<V> {
  readonly values: V;
  readonly valid: boolean;
  readonly pristine: boolean;
  readonly errors: Dict<string>;
}

export interface FormProps<V> extends FormStateProps<V> {
  readonly reset: () => void;
  readonly blur: (field: string) => void;
  readonly change: (field: string, value: any) => void;
}

const baseFormProps: FormStateProps<any> = {
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
  initialValues: any = {},
  logger?: (data: ActionProps) => void,
) {
  return (state: any, { type, field, value }: ActionProps) => {
    if (__DEV__ && logger) {
      logger({ type, field, value });
    }

    switch (type) {
      case Actions.Reset:
        return update(state, getInitialState(fields, initialValues));

      case Actions.Change: {
        if (!field) {
          return state;
        }

        const values = update(state.values, { [field]: value });
        const pristine = isEqual(values, initialValues);
        const errors = update(state.errors, { [field]: "" });

        return update(state, {
          errors,
          values,
          pristine,
        });
      }

      case Actions.Blur:
      case Actions.SetError: {
        if (!field) {
          return state;
        }

        const errors = update(state.errors, { [field]: value });

        const valid = Object.values(errors).filter(x => Boolean(x)).length === 0;

        return update(state, { errors, valid });
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
}: InputFormProps<V, E>): FormProps<V> {
  const initialState = useMemo(() => getInitialState(fields, initialValues), []);
  const reducer = useMemo(() => reducerWrapper(fields, initialValues), []);

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (onChange) {
      onChange(state.values);
    }
  }, [state.values]);

  useEffect(() => {
    if (error && formatError) {
      const errors: FormErrorProps[] = formatError(error);

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
