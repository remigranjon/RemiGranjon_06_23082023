const Sauce = require("../models/sauce");
const fs = require("fs");

exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then((sauces) => res.status(200).json(sauces))
    .catch((error) => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => res.status(200).json(sauce))
    .catch((error) => res.status(404).json({ error }));
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file
    ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete sauceObject._userId;
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(403).json({ message: "403:unauthorized request" });
      } else {
        Sauce.updateOne(
          { _id: req.params.id },
          { ...sauceObject, _id: req.params.id }
        )
          // delete former image if there is a new one
          .then(() => {
            if (req.file) {
              const filename = sauce.imageUrl.split("/images/")[1];
              fs.unlink(`images/${filename}`, (err) => {
                if (err) console.log(err);
              });
            }
          })
          .then(() => res.status(200).json({ message: "Sauce modifiée!" }))
          .catch((error) => {
            console.log(error);
            res.status(401).json({ error });
          });
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(400).json({ error });
    });
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(403).json({ message: "403:unauthorized request" });
      } else {
        const filename = sauce.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Sauce supprimée !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;

  const sauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
  });

  sauce
    .save()
    .then(() => res.status(201).json({ message: "Sauce enregistrée !" }))
    .catch((error) => res.status(400).json({ error }));
};

exports.likeSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (req.body.like === -1) {
        if (sauce.usersDisliked.includes(req.auth.userId)) {
          res
            .status(403)
            .json({ message: "Vous avez déjà disliké cette sauce." });
        } else if (sauce.usersLiked.includes(req.auth.userId)) {
          Sauce.findOneAndUpdate(
            { _id: req.params.id },
            { $inc: { likes: -1 } }
          )
            .then(() =>
              Sauce.findOneAndUpdate(
                { _id: req.params.id },
                { $inc: { dislikes: 1 } }
              )
            )
            .then(() => {
              sauce.usersDisliked.push(req.auth.userId);
              sauce.save();
            })
            .then(() =>
              Sauce.findOneAndUpdate(
                { _id: req.params.id },
                { $pull: { usersLiked: req.auth.userId } }
              )
            )
            .then(() => res.status(200).json({ message: "Sauce dislikée." }))
            .catch((error) => res.status(500).json({ error }));
        } else {
          Sauce.findOneAndUpdate(
            { _id: req.params.id },
            { $inc: { dislikes: 1 } }
          )
            .then(() => {
              sauce.usersDisliked.push(req.auth.userId);
              sauce.save();
            })
            .then(() => res.status(200).json({ message: "Sauce dislikée." }))
            .catch((error) => res.status(500).json({ error }));
        }
      } else if (req.body.like === 1) {
        if (sauce.usersLiked.includes(req.auth.userId)) {
          res.status(403).json({ message: "Vous avez déjà liké cette sauce." });
        } else if (sauce.usersDisliked.includes(req.auth.userId)) {
          Sauce.findOneAndUpdate(
            { _id: req.params.id },
            { $inc: { dislikes: -1 } }
          )
            .then(() =>
              Sauce.findOneAndUpdate(
                { _id: req.params.id },
                { $inc: { likes: 1 } }
              )
            )
            .then(() => {
              sauce.usersLiked.push(req.auth.userId);
              sauce.save();
            })
            .then(() =>
              Sauce.findOneAndUpdate(
                { _id: req.params.id },
                { $pull: { usersDisliked: req.auth.userId } }
              )
            )
            .then(() => res.status(200).json({ message: "Sauce likée." }))
            .catch((error) => res.status(500).json({ error }));
        } else {
          Sauce.findOneAndUpdate({ _id: req.params.id }, { $inc: { likes: 1 } })
            .then(() => {
              sauce.usersLiked.push(req.auth.userId);
              sauce.save();
            })
            .then(() => res.status(200).json({ message: "Sauce likée." }))
            .catch((error) => res.status(500).json({ error }));
        }
      } else if (req.body.like === 0) {
        if (sauce.usersLiked.includes(req.auth.userId)) {
          Sauce.findOneAndUpdate(
            { _id: req.params.id },
            { $inc: { likes: -1 } }
          )
            .then(() =>
              Sauce.findOneAndUpdate(
                { _id: req.params.id },
                { $pull: { usersLiked: req.auth.userId } }
              )
            )
            .then(() => res.status(200).json({ message: "Sauce délikée." }))
            .catch((error) => res.status(500).json({ error }));
        } else if (sauce.usersDisliked.includes(req.auth.userId)) {
          Sauce.findOneAndUpdate(
            { _id: req.params.id },
            { $inc: { dislikes: -1 } }
          )
            .then(() =>
              Sauce.findOneAndUpdate(
                { _id: req.params.id },
                { $pull: { usersDisliked: req.auth.userId } }
              )
            )
            .then(() => res.status(200).json({ message: "Sauce dédislikée." }))
            .catch((error) => res.status(500).json({ error }));
        } else {
          res.status(400).json({
            message: "Vous êtes déjà neutre par rapport à cette sauce.",
          });
        }
      }
    })
    .catch((error) => res.status(500).json({ error }));
};
