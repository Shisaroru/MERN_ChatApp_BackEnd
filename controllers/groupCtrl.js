import Groups from "../models/groupModel.js";

import { ResponseError } from "../class/ResponseError.js";

const groupCtrl = {
    getOneGroup: async (req, res, next) => {
        try {
            const { id } = req.body;
            if (id.length < 24) {
                return next(new ResponseError(400, "Invalid id"));
            };

            const result = await Groups.findById(id);
            if (!result) {
                return next(new ResponseError(400, "Group not found"));
            };

            return res.json({
                result,
            });
         } catch (error) {
            console.log(error);
            return next(new ResponseError(500, "Something went wrong"));
        }
    },
};

export default groupCtrl;