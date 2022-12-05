process.env.NODE_ENV = "test"

const request = require("supertest")
const app = require("../app")
const db = require("../db")

let book_isbn

beforeEach(async () => {
   // await db.query("DELET FROM books")

   let result = await db.query(`
      INSERT INTO 
         books (isbn, amazon_url, author, language, pages, publisher, title, year) 
         VALUES (
            '12345678',
            'http://amazon.com/books',
            'Taylor Jenkins Reid',
            'spanish',
            400,
            'Atria Books',
            'The Seven Husbands of Evelyn Hugo',
            2017)
         RETURNING isbn`)
   book_isbn = result.rows[0].isbn
})



describe("POST /books/", function () {
   test("create a new book", async () => {
      const resp = await request(app)
         .post("/books")
         .send({
            isbn: '999999999',
            amazon_url: "http://amazon.com/books",
            author: "Jenny",
            language: "english",
            pages: 789,
            publisher: "Publishing publisher",
            title: "This is My Life",
            year: 2020
         })
      expect(resp.statusCode).toBe(201)
      expect(resp.body.book).toHaveProperty("isbn")
   })

   test("prevent creating book without all required fields", async () => {
      const resp = await request(app)
         .post('/books')
         .send({ pages: 789 })

      expect(resp.statusCode).toBe(400)
   })
})

describe("GET /books", function () {
   test("Gets a list of 1 book", async function () {
      const resp = await request(app).get(`/books`);
      const books = resp.body.books;
      expect(books).toHaveLength(1);
      expect(books[0]).toHaveProperty("isbn");
      expect(books[0]).toHaveProperty("amazon_url");
   });
});


describe("GET /books/:isbn", function () {
   test("get details of a single book", async () => {
      const resp = await request(app)
         .get(`/books/${book_isbn}`)
      expect(resp.body.book).toHaveProperty("isbn")
      expect(resp.body.book.isbn).toBe(book_isbn)
   })

   test("404 if invalid isbn", async () => {
      const resp = await request(app)
         .get('/books/1111111')

      expect(resp.statusCode).toBe(404)
   })
})

describe("PUT /books/:isbn", function () {
   test("update a single book", async () => {
      const resp = await request(app)
         .put(`/books/${book_isbn}`)
         .send({
            amazon_url: "http://amazon.com/books",
            author: "Taylor Jenkins Reid",
            language: "spanish",
            pages: 400,
            publisher: "Atria Books",
            title: "UPDATED TITLE",
            year: 2017
         })
      // expect(resp.body.book).toHaveProperty("isbn")
      expect(resp.body.book.title).toBe("UPDATED TITLE")
   })

   test("prevent incorrect format for book update", async () => {
      const resp = await request(app)
         .put(`/books/${book_isbn}`)
         .send({
            isbn: "192828374",
            amazon_url: "http://amazon.com/books",
            author: "Taylor Jenkins Reid",
            language: "spanish",
            pages: 400,
            publisher: "Atria Books",
            title: "UPDATED TITLE",
            year: 2017
         })
      expect(resp.statusCode).toBe(400)
   })

})

describe("DELETE /books/:isbn", function () {
   test("404 for no book found", async () => {
      await request(app)
         .delete(`/books/${book_isbn}`)

      const resp = await request(app)
         .delete(`/books/${book_isbn}`)

      expect(resp.statusCode).toBe(404)
   })
})


afterEach(async function () {
   await db.query("DELETE FROM books");
});

afterAll(async () => {
   await db.end()
})