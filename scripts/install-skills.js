const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

const targets = [
    path.resolve('.agents/skills'),
    path.resolve(process.env.USERPROFILE, '.gemini/config/skills')
];

console.log('Targets:', targets);

// 1. Andrej Karpathy Skills
const karpathySrc = path.resolve('temp_skills/andrej-karpathy-skills/skills');
if (fs.existsSync(karpathySrc)) {
    for (const s of fs.readdirSync(karpathySrc)) {
        for (const t of targets) {
            copyDir(path.join(karpathySrc, s), path.join(t, s));
        }
    }
    console.log('1. Installed andrej-karpathy-skills');
}

// 2. UI-UX Pro Max Skills
const uiSrc1 = path.resolve('temp_skills/ui-ux-pro-max-skill/.claude/skills');
if (fs.existsSync(uiSrc1)) {
    for (const s of fs.readdirSync(uiSrc1)) {
        for (const t of targets) {
            copyDir(path.join(uiSrc1, s), path.join(t, s));
        }
    }
    console.log('2. Installed ui-ux-pro-max-skills');
}

// 3. Superpowers
const spSrc = path.resolve('temp_skills/superpowers/skills');
if (fs.existsSync(spSrc)) {
    for (const s of fs.readdirSync(spSrc)) {
        for (const t of targets) {
            copyDir(path.join(spSrc, s), path.join(t, s));
        }
    }
    console.log('3. Installed superpowers skills');
}

// 4. Caveman
const cmSrc = path.resolve('temp_skills/caveman/skills');
if (fs.existsSync(cmSrc)) {
    for (const s of fs.readdirSync(cmSrc)) {
        const full = path.join(cmSrc, s);
        if (fs.statSync(full).isDirectory()) {
            for (const t of targets) {
                copyDir(full, path.join(t, s));
            }
        }
    }
    console.log('4. Installed caveman skills');
}

// 5. Anthropic Skill Creator
const anthroCreatorSrc = path.resolve('temp_skills/anthropic-skills/skills/skill-creator');
if (fs.existsSync(anthroCreatorSrc)) {
    for (const t of targets) {
        copyDir(anthroCreatorSrc, path.join(t, 'skill-creator'));
    }
    console.log('5. Installed skill-creator from anthropic');
}

// 6. OpenMontage
const omSrc = path.resolve('temp_skills/OpenMontage');
if (fs.existsSync(omSrc)) {
    const omSkillsSrc = path.join(omSrc, 'skills');
    if (fs.existsSync(omSkillsSrc)) {
        for (const s of fs.readdirSync(omSkillsSrc)) {
            const full = path.join(omSkillsSrc, s);
            if (fs.statSync(full).isDirectory()) {
                for (const t of targets) copyDir(full, path.join(t, s));
            }
        }
    } else {
        // Entire OpenMontage as a skill
        for (const t of targets) copyDir(omSrc, path.join(t, 'openmontage'));
    }
    console.log('6. Installed openmontage skills');
}

console.log('Skill installation complete!');
