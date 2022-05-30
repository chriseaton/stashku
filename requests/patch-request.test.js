import PatchRequest from './patch-request.js';
import Filter from '../filter.js';
import jest from 'jest-mock';

describe('#constructor', () => {
    it('accepts no arguments', () => {
        expect(() => new PatchRequest()).not.toThrow();
        expect(new PatchRequest().metadata).toBeTruthy();
    });
    it('sets the template when a "template" argument is provided.', () => {
        expect(new PatchRequest({ a: 123 }).metadata.template).toEqual({ a: 123 });
    });
});

describe('#method', () => {
    it('returns "patch".', () => {
        expect(new PatchRequest().method).toBe('patch');
    });
});

describe('#model', () => {
    it('throws on a non-object, non-null model type.', () => {
        expect(() => new PatchRequest().model()).toThrow(/modelType.+object/i);
        expect(() => new PatchRequest().model(123)).toThrow(/modelType.+object/i);
        expect(() => new PatchRequest().model(true)).toThrow(/modelType.+object/i);
        expect(() => new PatchRequest().model('abc')).toThrow(/modelType.+object/i);
    });
    it('returns the request for chaining.', () => {
        let r = new PatchRequest();
        expect(r.model(class MyModel { })).toBe(r);
    });
    it('translates modeled where conditions.', () => {
        class TestModel {
            static get a() { return 'aaa'; }
            static get b() {
                return { target: 'bbbb' };
            }
            static get c() {
                return { target: 'c' };
            }
        }
        let r = new PatchRequest().where('{a} == 55 OR {b} ~~ "soda" OR {c} != 53');
        r.model(TestModel);
        expect(r.metadata.where.tree).toEqual({
            logic: 'or',
            filters: [
                { property: 'aaa', op: 'eq', value: 55 },
                { property: 'bbbb', op: 'contains', value: 'soda' },
                { property: 'c', op: 'neq', value: 53 }
            ]
        });
    });
    let resourceProps = [undefined, 'resource', 'name', 'slug', 'plural.name', 'plural.slug'];
    for (let prop of resourceProps) {
        it(`sets the metadata "from" property using the model resource property "${prop}".`, () => {
            class MyModel {
                static get $stashku() {
                    return {
                        resource: 'resource-abc',
                        name: 'name-abc',
                        slug: 'slug-abc',
                        plural: {
                            name: 'plural.name-abc',
                            slug: 'plural.slug-abc',
                        }
                    };
                }
            }
            let r = new PatchRequest().model(MyModel, false, prop);
            expect(r.metadata.to).toBe((prop ?? 'resource') + '-abc');
            r = new PatchRequest().model(class TestModel { });
            expect(r.metadata.to).toBe('TestModels');
            r = new PatchRequest().to('someresource').model(MyModel);
            expect(r.metadata.to).toBe('someresource');
        });
    }
});

describe('#count', () => {
    it('is disabled by default.', () => {
        let g = new PatchRequest();
        expect(g.metadata.count).toBe(false);
    });
    it('enables on an undefined argument.', () => {
        let g = new PatchRequest();
        expect(g.count().metadata.count).toBe(true);
    });
    it('enables the flag on a truthy value.', () => {
        expect(new PatchRequest().count(1).metadata.count).toBe(true);
        expect(new PatchRequest().count(true).metadata.count).toBe(true);
        expect(new PatchRequest().count({}).metadata.count).toBe(true);
        expect(new PatchRequest().count('abc').metadata.count).toBe(true);
    });
    it('disables the flag on a falsey value.', () => {
        expect(new PatchRequest().count(0).metadata.count).toBe(false);
        expect(new PatchRequest().count(false).metadata.count).toBe(false);
        expect(new PatchRequest().count(null).metadata.count).toBe(false);
        expect(new PatchRequest().count('').metadata.count).toBe(false);
    });
});

describe('#all', () => {
    it('enables the "all" metadata property when called without arguments.', () => {
        expect(new PatchRequest().all().metadata.all).toBe(true);
    });
    it('sets the "all" metadata property to a Boolean equivalent of the "enabled" argument.', () => {
        expect(new PatchRequest().all(1).metadata.all).toBe(true);
        expect(new PatchRequest().all(0).metadata.all).toBe(false);
        expect(new PatchRequest().all(true).metadata.all).toBe(true);
        expect(new PatchRequest().all(false).metadata.all).toBe(false);
    });
});

describe('#template', () => {
    it('throws when the "template" argument is a non-object.', () => {
        expect(() => new PatchRequest().template(1312312)).toThrow(/template.+argument/);
        expect(() => new PatchRequest().template([1, 2])).toThrow(/template.+argument/);
        expect(() => new PatchRequest().template(true)).toThrow(/template.+argument/);
    });
    it('sets the template when a "template" argument is provided.', () => {
        expect(new PatchRequest().template({ a: 123 }).metadata.template).toEqual({ a: 123 });
    });
    it('sets the "template" metadata to null when the "template" is null', () => {
        let r = new PatchRequest().template({ a: 123 });
        r.template(null);
        expect(r.metadata.template).toBeNull();
    });
});

describe('#where', () => {
    it('throws on a non-filtering "conditions" argument.', () => {
        expect(() => new PatchRequest().where(1312312)).toThrow(/conditions.+argument/);
        expect(() => new PatchRequest().where(new Date())).toThrow(/conditions.+argument/);
        expect(() => new PatchRequest().where({})).toThrow(/conditions.+argument/);
        expect(() => new PatchRequest().where([1, 2])).toThrow(/conditions.+argument/);
        expect(() => new PatchRequest().where(true)).toThrow(/conditions.+argument/);
    });
    it('sets the "where" metadata to the Filter from the "conditions" argument.', () => {
        let f1 = Filter.and('a', Filter.OP.CONTAINS, 'z');
        let f2 = Filter.and('b', Filter.OP.CONTAINS, 'b');
        let r = new PatchRequest().where(f1);
        expect(r.metadata.where).toBe(f1);
        r.where(f2);
        expect(r.metadata.where).toBe(f2);
    });
    it('resolves a callback to a Filter instance and sets the metadata.', () => {
        let r = new PatchRequest();
        r.where(f => f.and('a', Filter.OP.CONTAINS, 'z'));
        expect(r.metadata.where).toBeInstanceOf(Filter);
        expect(r.metadata.where.tree.logic).toBe(Filter.LOGIC.AND);
        expect(r.metadata.where.tree.filters.length).toBe(1);
        expect(r.metadata.where.tree.filters[0].property).toBe('a');
        expect(r.metadata.where.tree.filters[0].op).toBe(Filter.OP.CONTAINS);
        expect(r.metadata.where.tree.filters[0].value).toBe('z');
    });
    it('clears the "where" metadata when a null is passed.', () => {
        let r = new PatchRequest();
        r.where(null);
        expect(r.metadata.where).toBeNull();
    });
    it('returns the request instance in any valid call.', () => {
        let r = new PatchRequest();
        expect(r.where(null)).toBe(r);
        expect(r.where(f => f.and('a', Filter.OP.CONTAINS, 'z'))).toBe(r);
        expect(r.where(Filter.and('a', Filter.OP.CONTAINS, 'z'))).toBe(r);
    });
});

describe('#to', () => {
    it('throws on a non-string "name" argument.', () => {
        expect(() => new PatchRequest().to(1312312)).toThrow(/name.+argument/);
        expect(() => new PatchRequest().to(new Date())).toThrow(/name.+argument/);
        expect(() => new PatchRequest().to({})).toThrow(/name.+argument/);
        expect(() => new PatchRequest().to([1, 2])).toThrow(/name.+argument/);
        expect(() => new PatchRequest().to(true)).toThrow(/name.+argument/);
    });
    it('sets the "to" metadata with the "name" argument value.', () => {
        let r = new PatchRequest().to('test');
        expect(r.metadata.to).toBe('test');
        r.to('abc', '123');
        expect(r.metadata.to).toBe('abc');
    });
    it('clears the "to" metadata when a null is passed.', () => {
        let r = new PatchRequest().to('test');
        r.to(null);
        expect(r.metadata.to).toBeNull();
    });
    it('returns the request instance in any valid call.', () => {
        let r = new PatchRequest();
        expect(r.to('a')).toBe(r);
        expect(r.to(null)).toBe(r);
    });
});

describe('#clear', () => {
    it('resets metadata object properties to default.', () => {
        let r = new PatchRequest()
            .template({})
            .to('somewhere', 's')
            .where(f => f.and('a', Filter.OP.CONTAINS, 'z'));
        r.clear();
        expect(r.metadata.template).toBeNull();
        expect(r.metadata.where).toBeNull();
        expect(r.metadata.to).toBeNull();
        expect(r.metadata.headers).toBeNull();
    });
    it('recreates the metadata object if it is null', () => {
        let r = new PatchRequest();
        r.metadata = null;
        r.clear();
        expect(r.metadata).toBeTruthy();
        expect(r.metadata).toBeInstanceOf(Object);
    });
    it('returns the request instance in any valid call.', () => {
        let r = new PatchRequest();
        expect(r.clear()).toBe(r);
    });
});

describe('#headers', () => {
    it('throws when the dictionary argument is missing.', () => {
        expect(() => new PatchRequest().headers()).toThrow(/dictionary.+argument/);
    });
    it('throws when the dictionary argument is not a Map, object, or null.', () => {
        expect(() => new PatchRequest().headers(244)).toThrow(/dictionary.+argument/);
        expect(() => new PatchRequest().headers(true)).toThrow(/dictionary.+argument/);
        expect(() => new PatchRequest().headers(undefined)).toThrow(/dictionary.+argument/);
    });
    it('throws when the a non-string key is defined.', () => {
        let m = new Map();
        m.set('ok', true);
        m.set(123, true);
        expect(() => new PatchRequest().headers(m)).toThrow(/key.+argument/);
    });
    it('skips null or undefined keys.', () => {
        let m = new Map();
        m.set(null, true);
        m.set('ok', true);
        expect(new PatchRequest().headers(m).metadata.headers.size).toBe(1);
    });
    it('deletes the header if the value for the key is null or undefined.', () => {
        let r = new PatchRequest();
        r.headers({ a: 1, b: 'hi', c: true });
        expect(r.metadata.headers.size).toBe(3);
        r.headers({ b: null });
        expect(r.metadata.headers.size).toBe(2);
        expect(r.metadata.headers.get('b')).toBeUndefined();
        r.headers({ c: undefined });
        expect(r.metadata.headers.size).toBe(1);
        expect(r.metadata.headers.get('c')).toBeUndefined();
    });
    it('creates a header map from an object.', () => {
        let r = new PatchRequest();
        r.headers({
            a: 1,
            b: 'hi',
            c: true,
            z: { complex: new Date() }
        });
        expect(r.metadata.headers).toBeInstanceOf(Map);
        expect(r.metadata.headers.size).toBe(4);
        expect(r.metadata.headers.get('a')).toBe(1);
        expect(r.metadata.headers.get('b')).toBe('hi');
        expect(r.metadata.headers.get('c')).toBe(true);
        expect(r.metadata.headers.get('z')).toBeTruthy();
        expect(r.metadata.headers.get('z').complex).toBeInstanceOf(Date);
    });
    it('creates a header map from a Map.', () => {
        let r = new PatchRequest();
        let myMap = new Map();
        myMap.set('a', 1);
        myMap.set('b', 'hi');
        myMap.set('c', true);
        myMap.set('z', { complex: new Date() });
        r.headers(myMap);
        expect(r.metadata.headers).toBeInstanceOf(Map);
        expect(r.metadata.headers.size).toBe(4);
        expect(r.metadata.headers.get('a')).toBe(1);
        expect(r.metadata.headers.get('b')).toBe('hi');
        expect(r.metadata.headers.get('c')).toBe(true);
        expect(r.metadata.headers.get('z')).toBeTruthy();
        expect(r.metadata.headers.get('z').complex).toBeInstanceOf(Date);
    });
    it('merges properties from subsequent calls.', () => {
        let r = new PatchRequest();
        let myMap = new Map();
        myMap.set('a', 1);
        myMap.set('b', 'hi');
        myMap.set('c', true);
        r.headers(myMap);
        r.headers({ z: { complex: new Date() } });
        r.headers({ b: 'dinosaurs' });
        expect(r.metadata.headers).toBeInstanceOf(Map);
        expect(r.metadata.headers.size).toBe(4);
        expect(r.metadata.headers.get('a')).toBe(1);
        expect(r.metadata.headers.get('b')).toBe('dinosaurs');
        expect(r.metadata.headers.get('c')).toBe(true);
        expect(r.metadata.headers.get('z')).toBeTruthy();
        expect(r.metadata.headers.get('z').complex).toBeInstanceOf(Date);
    });
    it('should clear any headers when null is passed.', () => {
        let r = new PatchRequest();
        r.headers({ a: 1, b: 'hi', c: true });
        expect(r.headers(null).metadata.headers).toBeInstanceOf(Map);
        expect(r.metadata.headers.size).toBe(0);
    });
    it('returns the request instance in any valid call.', () => {
        let r = new PatchRequest();
        expect(r.headers({})).toBe(r);
        expect(r.headers(new Map())).toBe(r);
        expect(r.headers(null)).toBe(r);
    });
});

describe('#toJSON', () => {
    it('returns the metadata to utilize for JSON stringifying.', () => {
        let r = new PatchRequest()
            .to('Goose')
            .headers({ hello: 'world' })
            .template({ Bob: 'Sue', Hi: 12345 })
            .count();
        let parsed = JSON.parse(JSON.stringify(r));
        expect(parsed.to).toEqual(r.metadata.to);
        expect(parsed.all).toBeUndefined();
        expect(parsed.count).toBe(true);
        expect(parsed.template).toEqual({ Bob: 'Sue', Hi: 12345 });
        expect(parsed.headers).toEqual({ hello: 'world' });
    });
});