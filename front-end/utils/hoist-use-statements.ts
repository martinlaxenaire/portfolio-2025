// hoist @use statements
// @see https://github.com/vitejs/vite/discussions/6361#discussioncomment-4255300

// following code is from sass-resources-loader
// @see https://github.com/shakacode/sass-resources-loader/blob/ec1d6e5bf9668c1c68a7f10adb30c30740dedd96/src/utils/processResources.js#L13

// Matches opening and closing parenthesis across multiple lines
const multilineParenthesisRegex = '\\([\\s\\S]*?\\);?'
// Finds any @use statement
const useRegex = `^@use \\S*(?: with ${multilineParenthesisRegex}|.*)?\n?$`
// Same as above, but adds the m (multiline) flag
const useRegexTest = new RegExp(useRegex, 'm')
// Makes sure that only the last instance of `useRegex` variable is found
const useRegexReplace = new RegExp(`${useRegex}(?![\\s\\S]*${useRegex})`, 'gm')

export function hoistUseStatements(resources: string): (key: string) => string {
    return function (source: string): string {
        if (useRegexTest.test(source)) {
            const output = source.replace(useRegexReplace, useStatements => `${useStatements}\n${resources}`)

            // De-duplicate identical imports
            const importedResources: Record<string, boolean | undefined> = {}
            return output.replace(new RegExp(useRegex, 'mg'), (importedResource: string) => {
                if (importedResources[importedResource]) {
                    return ''
                }

                importedResources[importedResource] = true
                return importedResource
            })
        }

        return `${resources}\n${source}`
    }
}
