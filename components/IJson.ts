export default interface Json<T> {
    serialize: (value:T) => object;
    deserialize: (json:object) => T;
}