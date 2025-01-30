import {
  BaseEntity,
  Cascade,
  Collection,
  Entity,
  ManyToMany,
  ManyToOne,
  MikroORM,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { EntityGenerator } from "@mikro-orm/entity-generator";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";

@Entity()
export class User extends BaseEntity {
  @PrimaryKey()
  id!: number;
}

@Entity({ schema: "books" })
export class Book extends BaseEntity {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  author!: User;
}

describe("multiple connected schemas in postgres", () => {
  let orm: MikroORM<PostgreSqlDriver>;

  beforeEach(async () => {
    orm = await MikroORM.init({
      entities: [Book, User],
      dbName: `mikro_orm_test_multi_schemas`,
      driver: PostgreSqlDriver,
      extensions: [EntityGenerator],
      schema: "public",
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute(
      `
      drop schema if exists "public" cascade;
      drop schema if exists "books" cascade;
      create schema if not exists "public";
      create schema if not exists "books";
      create table "public"."user" ("id" serial primary key);
      create table "books"."book" ("id" serial primary key, "author_id" serial);`
    );
  });

  afterEach(async () => {
    await orm.close(true);
  });

  test("an entity can be persisted along with its' related entities that exist in a different schema", async () => {
    let book = new Book();
    book.author = new User();
    await orm.em.persistAndFlush(book);

    orm.em.clear();
    book = await orm.em.findOneOrFail(Book, book, { populate: ["*"] });

    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toEqual([
      "Book-books:1",
      "User-public:1",
    ]);
  });
});
