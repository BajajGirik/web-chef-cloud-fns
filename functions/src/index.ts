import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
admin.initializeApp();

export const updateCartAmountOnCreate = functions.firestore
  .document("users/{userId}/cart/{productId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    if (data) {
      try {
        const productId = context.params.productId;
        const productSnap = await admin
          .firestore()
          .doc(`products/${productId}`)
          .get();
        if (productSnap?.data()?.price === undefined) return null;

        let amount = productSnap!.data()!.price * data.qty;

        const userRef = snapshot.ref.parent.parent;
        const userSnap = await userRef?.get();
        amount =
          (userSnap!.data()?.amount ? userSnap!.data()?.amount : 0) + amount;

        return userRef!.set({ amount: amount }, { merge: true });
      } catch (err) {
        console.log(err);
      }
    }

    return null;
  });

export const updateCartAmountOnUpdate = functions.firestore
  .document("users/{userId}/cart/{productId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    try {
      const productId = context.params.productId;
      const productSnap = await admin
        .firestore()
        .doc(`products/${productId}`)
        .get();
      if (productSnap?.data()?.price === undefined) return null;

      let amount =
        productSnap!.data()!.price * (afterData.qty - beforeData.qty);

      const userRef = change.after.ref.parent.parent;
      const userSnap = await userRef?.get();
      amount =
        (userSnap!.data()?.amount ? userSnap!.data()?.amount : 0) + amount;

      return userRef!.set({ amount: amount }, { merge: true });
    } catch (err) {
      console.log(err);
    }

    return null;
  });
