class Struct {
    constructor(id, ethId, name, created, categories, links) {
        this._id = id;
        this.name = name;
        this.ethId = ethId;
        this.created = created;
        this.categories = categories
        this.links = links;
    }
}

module.exports = { struct: Struct };