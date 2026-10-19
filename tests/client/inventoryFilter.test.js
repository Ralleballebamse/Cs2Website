import test from "node:test";
import assert from "node:assert/strict";
import { isDefaultWeapon } from "../../public/assets/scripts/inventory/inventoryFilter.js";

test("hide default guns but preserve painted, StatTrak and Souvenir finishes", () => {
    const tags = [{ internal_name: "CSGO_Type_Rifle" }];
    assert.equal(isDefaultWeapon({ market_hash_name: "AK-47", tags }), true);
    for (const name of ["AK-47 | Redline (Field-Tested)", "StatTrak™ AK-47 | Redline (Field-Tested)", "Souvenir AK-47 | Safari Mesh (Factory New)"]) {
        assert.equal(isDefaultWeapon({ market_hash_name: name, tags }), false);
    }
});

test("hide standard side knives while preserving special vanilla and painted knives", () => {
    for (const weapon of ["weapon_knife", "weapon_knife_t"]) {
        assert.equal(isDefaultWeapon({ name: "Knife", tags: [{ category: "Weapon", internal_name: weapon }] }), true);
    }
    for (const name of ["★ Karambit", "★ Bayonet", "★ StatTrak™ Karambit", "★ Karambit | Doppler (Factory New)"]) {
        assert.equal(isDefaultWeapon({ market_hash_name: name, tags: [{ internal_name: "CSGO_Type_Knife" }] }), false);
    }
});

test("cases and agents without a paint finish are kept", () => {
    assert.equal(isDefaultWeapon({ name: "Revolution Case", type: "Base Grade Container" }), false);
    assert.equal(isDefaultWeapon({ name: "Special Agent Ava | FBI", type: "Master Agent" }), false);
});

test("hide default Zeus and C4 while retaining Zeus skins", () => {
    assert.equal(isDefaultWeapon({ name: "Zeus x27" }), true);
    assert.equal(isDefaultWeapon({ name: "C4 Explosive" }), true);
    assert.equal(isDefaultWeapon({ name: "C4", tags: [{ category: "Weapon", internal_name: "weapon_c4" }] }), true);
    assert.equal(isDefaultWeapon({ market_hash_name: "Zeus x27 | Olympus (Factory New)", tags: [{ category: "Weapon", internal_name: "weapon_taser" }] }), false);
});
