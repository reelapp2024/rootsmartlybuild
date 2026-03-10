export type Node = {
  id: string;
  type: string;
  props?: Record<string, any>;
  style?: React.CSSProperties;
  children?: Node[];
};

export type PageDoc = {
  _version: number;
  id: string;
  slug: string;
  title: string;
  root: Node;
};