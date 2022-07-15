import {
    JSX,
    Application,
    DefaultTheme,
    DefaultThemeRenderContext,
    PageEvent,
    Reflection,
    ContainerReflection,
} from 'typedoc';

class MyThemeRenderContext extends DefaultThemeRenderContext {
    // DefaultThemeRenderContext does not have methods, but rather assigns its methods as
    // properties, in its constructor. So super.something() won’t work. As a workaround,
    // build a second instance to access the original implementations of its methods.
    private superish: DefaultThemeRenderContext
    constructor(theme, options) {
        super(theme, options)
        this.superish = new DefaultThemeRenderContext(theme, options)
    }

    override settings = () => null

    override primaryNavigation = () => (
        // XXX Keep in sync with /doc/_include/top_layout.html
        <ul class="mynavigation">
            <li>
                <a href="/">Freeze-dry main page</a>
            </li>
            <li>
                <a href="/how-it-works/">How freeze-dry works</a>
            </li>
            <li>
                <a href="/api/">API overview</a>
            </li>
        </ul>
    )
    override secondaryNavigation = (props: PageEvent<Reflection>) => {
        // Use the index partial to show categories etc.
        return (props.model instanceof ContainerReflection)
            ? this.superish.index(props.model)
            : null
    }
}

class MyTheme extends DefaultTheme {
    myThemeRenderContext: DefaultThemeRenderContext = new MyThemeRenderContext(this, this.application.options)

    override getRenderContext() {
        return this.myThemeRenderContext
    }
}

export function load(app: Application) {
    app.renderer.defineTheme('mytheme', MyTheme)
}
