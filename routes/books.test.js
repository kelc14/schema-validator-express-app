// Tell Node that we're in test "mode"
process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

const Book = require("../models/book");

let book;
beforeEach(async () => {
  await db.query("DELETE FROM books");

  book = await Book.create({
    isbn: "0691161518",
    amazon_url: "http://a.co/eobPtX2",
    author: "Matthew Lane",
    language: "english",
    pages: 264,
    publisher: "Princeton University Press",
    title: "Power-Up: Unlocking Hidden Math in Video Games",
    year: 2017,
  });
});

afterAll(async () => {
  await db.end();
});

// **
// * Test GET routes for books - get
// *    all books
// **

describe("GET /", () => {
  test("Get a list of all books", async () => {
    const res = await request(app).get("/books/");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ books: [book] });
  });
});

// **
// * Test GET routes for ONE book - get
// *    single book by id ISBN
// **

describe("GET /:id", () => {
  test("Get a book by its id (isbn)", async () => {
    const res = await request(app).get(`/books/${book.isbn}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ book: book });
  });

  test("Attempt to get a book by its incorrect id (isbn)", async () => {
    const res = await request(app).get(`/books/0`);
    expect(res.statusCode).toBe(404);
  });
});

// **
// * Test POST routes for adding a new book
// *
// *     test schema to make sure all
// *    required properties are present
// *
// *     test schema to make sure all
// *    properties are valid data types
// **

describe("POST /", () => {
  test("Add a new book", async () => {
    let newBook = {
      isbn: "0123456789",
      amazon_url: "http://a.co/eobPtX2",
      author: "Test Author",
      language: "english",
      pages: 100,
      publisher: "Test Publisher",
      title: "Test Title",
      year: 2023,
    };
    const res = await request(app).post("/books/").send({
      book: newBook,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ book: newBook });
  });

  test("Attempt to add a new book with mising information (author, language", async () => {
    let newBook2 = {
      isbn: "0123456789",
      amazon_url: "http://a.co/eobPtX2",
      pages: 100,
      publisher: "Test Publisher",
      title: "Test Title",
      year: 2023,
    };
    const res = await request(app).post("/books/").send({
      book: newBook2,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toEqual([
      'instance.book requires property "author"',
      'instance.book requires property "language"',
    ]);
  });

  test("Add a new book with incorrect information (year as a string)", async () => {
    let newBook3 = {
      isbn: "0123456789",
      amazon_url: "http://a.co/eobPtX2",
      author: "Test Author",
      language: "english",
      pages: 100,
      publisher: "Test Publisher",
      title: "Test Title",
      year: "2023",
    };
    const res = await request(app).post("/books/").send({
      book: newBook3,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toEqual([
      "instance.book.year is not of a type(s) integer",
    ]);
  });
});

// **
// * Test PUT routes for updating an
// *    existing book
// *
// *     test schema to make sure all
// *    properties are valid data types
// **

describe("PUT /:isbn", () => {
  test("Update a book by isbn", async () => {
    const res = await request(app)
      .put(`/books/${book.isbn}`)
      .send({
        book: {
          title: "New Title",
        },
      });
    book.title = "New Title";
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ book: book });
  });

  test("Attempt to update a book by isbn with invalid data type page", async () => {
    const res = await request(app)
      .put(`/books/${book.isbn}`)
      .send({
        book: {
          pages: "123",
        },
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toEqual([
      "instance.book.pages is not of a type(s) integer",
    ]);
  });
});

// **
// * Test DELETE routes for deleting a book
// *
// **

describe("DELETE /:isbn", () => {
  test("Delete a book by isbn", async () => {
    const res = await request(app).delete(`/books/${book.isbn}`);

    expect(res.statusCode).toBe(200);
  });

  test("Attempt to delete a book by incorrect isbn", async () => {
    const res = await request(app).delete(`/books/0`);

    expect(res.statusCode).toBe(404);
  });
});
