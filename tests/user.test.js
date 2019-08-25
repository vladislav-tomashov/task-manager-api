const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const { userOneId, userOne, setupDatabase } = require("./fixtures/db");

beforeEach(setupDatabase);

test("Should signup a new user", async done => {
  const response = await request(app)
    .post("/users")
    .send({
      name: "Vlad",
      password: "1234567",
      email: "vladislav.tomashov2@gmail.com"
    })
    .expect(201);

  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  expect(response.body).toMatchObject({
    user: {
      name: "Vlad",
      email: "vladislav.tomashov2@gmail.com"
    },
    token: user.tokens[0].token
  });
  expect(user.password).not.toBe("1234567");

  done();
});

test("Should login existing user", async done => {
  const response = await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: userOne.password
    })
    .expect(200);
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  expect(response.body).toMatchObject({
    user: {
      name: userOne.name,
      email: userOne.email
    },
    token: user.tokens[user.tokens.length - 1].token
  });
  expect(response.body.user.password).toBeUndefined();
  done();
});

test("Should not login nonexisting user", async done => {
  await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: "userOne.password"
    })
    .expect(400);
  done();
});

test("Should get profile for user", async () => {
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test("Should not get profile for nonexisting user", async () => {
  await request(app)
    .get("/users/me")
    .send()
    .expect(401);
});

test("Should delete account for autenticated user", async () => {
  const response = await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test("Should not delete account for unautenticated user", async () => {
  await request(app)
    .delete("/users/me")
    .send()
    .expect(401);
});

test("Should upload avatar image", async () => {
  const response = await request(app)
    .post("/users/me/avatar")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .attach("avatar", "tests/fixtures/profile-pic.jpg")
    .expect(200);
  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test("Should update valid fields", async () => {
  const response = await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: "Changed Vlad"
    })
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.name).toBe("Changed Vlad");
});

test("Should not update invalid fields", async () => {
  const response = await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      name1: "Changed Vlad2"
    })
    .expect(400);
});
