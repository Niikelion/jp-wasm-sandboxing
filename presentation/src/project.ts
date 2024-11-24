import {makePlugin, makeProject} from '@motion-canvas/core'

import cover from "./scenes/cover?scene"
import applications from "./scenes/applications?scene"
import existingSolutions from "./scenes/existingSolutions?scene"
import problem from "./scenes/problem?scene"
import rescue from "./scenes/rescue?scene"
import base from "./scenes/base?scene"
import metering from "./scenes/metering?scene"
import sources from "./scenes/sources?scene"
import end from "./scenes/end?scene"

const scenes = [
    cover,
    applications,
    existingSolutions,
    problem,
    rescue,
    base,
    metering,
    sources,
    end
]

export default makeProject({
    scenes,
    experimentalFeatures: true,
    plugins: [
        makePlugin({
            name: 'shortcuts',
            presenter(presenter) {
                document.addEventListener('keydown', event => {
                    switch (event.key) {
                        case '.':
                            presenter.resume()
                            break;
                    }
                })
            },
        })(),
    ],
})
