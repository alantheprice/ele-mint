export interface ComponentData<T> extends T {}

export class Component<T, R> {
  constructor(passedInData: T, initialData: R);

  onAttach(
    element: HTMLElement,
    data: T & R,
    update: (newData: ComponentData<T>) => void,
    context: Component<T, R>
  ): void;

  onRender(
    element: HTMLElement,
    data: T & R,
    update: (newData: ComponentData<T>) => void,
    context: Component<T, R>
  ): void;

  onWillRemove(): void;

  dataDidChange(current: T & R, updated: T & R): boolean;

  updateReducer(previousData: T & R, newData: T & R): T & R;

  content(
    data: ComponentData<T>,
    update: (newData: ComponentData<T>) => void
  ): ComponentFunction<T, R>;
}

export interface ComponentOverrides<T, R> {
  onAttach?: (
    element: HTMLElement,
    data: T & R,
    update: (newData: ComponentData<T>) => void,
    context: Component<T, R>
  ) => void;

  onRender?: (
    element: HTMLElement,
    data: T & R,
    update: (newData: ComponentData<T>) => void,
    context: Component<T, R>
  ) => void;

  onWillRemove?: () => void;

  dataDidChange?: (current: T & R, updated: T & R) => boolean;

  updateReducer?: (previousData: T & R, newData: T & R) => T & R;
}

export type ComponentFunction<T, R> = (
  configOrChild?: ComponentData<T & R> | ComponentFunction<any, any> | string,
  firstChild?: ComponentFunction<any, any> | string,
  ...children: ComponentFunction<any, any>[]
) => ComponentFunction<T, R>;

export function registerComponent<T, R>(
  contentFunction:
    | ((
        data: ComponentData<T>,
        update: (newData: ComponentData<T>) => void
      ) => ComponentFunction<T, R>)
    | Component<T, R>,
  initialData?: ComponentData<R>,
  overrides?: ComponentOverrides<T, R>
): ComponentFunction<T, R> | ComponentFunction<T, R>;

export function registerComponent<T, R>(
  component: Component<T, R>
): ComponentFunction<T, R>;

export function register<T>(
  tagName: string,
  overrides?: ComponentOverrides<T, {}>
): ComponentFunction<T, {}>;

// Svg's use a different namespace and must be created with this reg
export function registerSvg<T>(tagName: string): ComponentFunction<T, {}>;
