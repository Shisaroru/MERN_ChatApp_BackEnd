export class SearchUser {
    constructor(query, name) {
        this.query = query;
        this.name = name;
    };

    // Find name contained this.name, with i flag mean no case sensitive
    filtering() {
        this.query.find({ name: { $regex: `${this.name}`, $options: 'i', }, });
        return this;
    };


    // Limit the number of results
    paginating() {
        this.query = this.query.limit(5);
        return this;
    };
}