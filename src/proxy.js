const proxy = {
    Math: {
        ...Math,
        parseInt: parseInt,
        add: (...args) => args.reduce((total, num) => total + Number(num), 0),
        multiply: (...args) => args.reduce((total, num) => total * Number(num), 0)
    },
    String: {
        ...String,
        concat: (joiner, ...args) => args.join(joiner),
        match: (str, rgx) => {
            const result = str.match(rgx);
            return result?.length ? result[1] : '';
        }
    },
}

export default proxy;