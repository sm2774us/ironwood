import {
  CONTENT_MODELS,
  type ContentModel,
  type Hero,
  type Offer,
  type Room,
  type Venue,
} from '@ironwood/shared';
import { heroes, offers, rooms, venues } from '../data/seed';
import { AppError, notFound } from '../lib/errors';

type Fragment = { _id: string } & Record<string, unknown>;

/**
 * In-memory stand-in for AEM's content repository (JCR). Swapping it for a real AEM
 * author/publish tier means replacing this class's read path with an HTTP client — the
 * GraphQL layer and the frontend are unchanged (see docs/adr/0003).
 */
export class ContentStore {
  private data: Record<ContentModel, Fragment[]>;
  private _version = 1;

  constructor() {
    this.data = structuredClone({
      hero: heroes,
      offer: offers,
      room: rooms,
      venue: venues,
    }) as Record<ContentModel, Fragment[]>;
  }

  get version(): number {
    return this._version;
  }

  heroes = (): Hero[] => this.data.hero as unknown as Hero[];
  offers = (): Offer[] => this.data.offer as unknown as Offer[];
  rooms = (): Room[] => this.data.room as unknown as Room[];
  venues = (): Venue[] => this.data.venue as unknown as Venue[];

  /** Applies a dotted-path string edit and re-validates the full fragment against its model. */
  patch(model: ContentModel, id: string, prop: string, value: string): Fragment {
    const list = this.data[model];
    const index = list.findIndex((f) => f._id === id);
    const current = list[index];
    if (index < 0 || !current) throw notFound(`${model} fragment "${id}"`);

    const draft = structuredClone(current);
    const keys = prop.split('.');
    const last = keys.pop() as string;
    let cursor: Record<string, unknown> = draft;
    for (const k of keys) {
      const next = cursor[k];
      if (typeof next !== 'object' || next === null)
        throw new AppError(422, 'BAD_PROP', `Unknown property "${prop}"`);
      cursor = next as Record<string, unknown>;
    }
    if (typeof cursor[last] !== 'string') {
      throw new AppError(422, 'BAD_PROP', `"${prop}" is not an editable text property`);
    }
    cursor[last] = value;

    const result = CONTENT_MODELS[model].safeParse(draft);
    if (!result.success) {
      throw new AppError(422, 'VALIDATION', result.error.issues.map((i) => i.message).join('; '));
    }
    list[index] = draft;
    this._version += 1;
    return draft;
  }
}
