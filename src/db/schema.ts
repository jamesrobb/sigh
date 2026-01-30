import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const huntStatus = sqliteTable("hunt_status", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
});

export const hunt = sqliteTable("hunt", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  huntStatusId: integer("hunt_status_id")
    .notNull()
    .references(() => huntStatus.id),
  name: text("name").notNull(),
  notes: text("notes"),
  startDate: integer("start_date", { mode: "timestamp_ms" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp_ms" }),
});

export const company = sqliteTable("company", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  url: text("url"),
  linkedin: text("linkedin"),
  notes: text("notes"),
});

export const currency = sqliteTable("currency", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
});

export const person = sqliteTable("person", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id")
    .notNull()
    .references(() => company.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  title: text("title"),
  phone: text("phone"),
  email: text("email"),
  linkedin: text("linkedin"),
  notes: text("notes"),
});

export const role = sqliteTable("role", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  huntId: integer("hunt_id")
    .notNull()
    .references(() => hunt.id),
  companyId: integer("company_id")
    .notNull()
    .references(() => company.id),
  title: text("title").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  description: text("description"),
  descriptionDocumentPath: text("description_document_path"),
  descriptionDocumentName: text("description_document_name"),
  notes: text("notes"),
  salaryLowerEnd: integer("salary_lower_end"),
  salaryHigherEnd: integer("salary_higher_end"),
  currencyId: integer("currency_id").references(() => currency.id),
});

export const tag = sqliteTable("tag", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const roleTag = sqliteTable(
  "role_tag",
  {
    roleId: integer("role_id")
      .notNull()
      .references(() => role.id),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tag.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.tagId] }),
  })
);

export const personTag = sqliteTable(
  "person_tag",
  {
    personId: integer("person_id")
      .notNull()
      .references(() => person.id),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tag.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.personId, table.tagId] }),
  })
);

export const interactionTypeRole = sqliteTable("interaction_type_role", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
});

export const interactionRole = sqliteTable("interaction_role", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id")
    .notNull()
    .references(() => company.id),
  personId: integer("person_id").references(() => person.id),
  roleId: integer("role_id")
    .notNull()
    .references(() => role.id),
  interactionTypeId: integer("interaction_type_id")
    .notNull()
    .references(() => interactionTypeRole.id),
  occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
  notes: text("notes"),
});

export const interactionTypePerson = sqliteTable("interaction_type_person", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
});

export const interactionPerson = sqliteTable("interaction_person", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  personId: integer("person_id")
    .notNull()
    .references(() => person.id),
  interactionTypeId: integer("interaction_type_id")
    .notNull()
    .references(() => interactionTypePerson.id),
  occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
  notes: text("notes"),
});
