import { type EntityProperty } from '@mikro-orm/core';

import { UnicodeStringType } from './UnicodeStringType';

export class UnicodeCharacterType extends UnicodeStringType {

  override getColumnType(prop: EntityProperty) {
    return `nchar(${prop.length ?? 1})`;
  }

}
