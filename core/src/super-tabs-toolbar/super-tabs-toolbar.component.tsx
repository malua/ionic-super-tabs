import {
  Component,
  ComponentInterface,
  Element,
  Event,
  EventEmitter,
  Listen,
  Method,
  Prop,
} from '@stencil/core';
import { SuperTabsConfig } from '../super-tabs.model';

@Component({
  tag: 'super-tabs-toolbar',
  styleUrl: 'super-tabs-toolbar.component.scss',
  shadow: true,
})
export class SuperTabsToolbarComponent implements ComponentInterface {

  @Element() el!: HTMLSuperTabsToolbarElement;

  @Prop({ mutable: true }) toolbarPosition: 'top' | 'bottom' = 'top';
  @Prop() config?: SuperTabsConfig;
  @Prop() showIndicator: boolean = true;
  @Prop() color: string = 'primary';

  private indicatorPosition!: number;
  private indicatorWidth!: number;
  private isDragging!: boolean;

  @Event() buttonClick!: EventEmitter<HTMLSuperTabButtonElement>;

  buttons!: HTMLSuperTabButtonElement[];

  private activeButton?: HTMLSuperTabButtonElement;
  private activeTabIndex: number = 0;
  private indicatorEl!: HTMLSuperTabIndicatorElement;

  @Method()
  onButtonClick(button: HTMLSuperTabButtonElement) {
    this.buttonClick.emit(button);
    this.setActiveTab(button.index as number);
  }

  @Method()
  setActiveTab(index: number) {
    this.activeTabIndex = index;
    this.alignIndicator(index);
    this.markButtonActive(this.buttons[index]);
  }

  @Method()
  setSelectedTab(index: number) {
    this.alignIndicator(index);
  }

  @Listen('window:resize')
  onWindowResize() {
    this.alignIndicator(this.activeTabIndex);
  }

  @Listen('click')
  onClick(ev: any) {
    let button: HTMLSuperTabButtonElement = ev.target;

    const tag = button.tagName.toLowerCase();

    if (tag !== 'super-tab-button') {
      if (tag === 'super-tabs-toolbar') {
        return;
      }

      button = button.closest('super-tab-button') as HTMLSuperTabButtonElement;
    }

    this.setActiveTab(button.index as number);
    this.buttonClick.emit(button);
  }

  componentDidLoad() {
    this.indexButtons();
  }

  componentDidUpdate() {
    this.indexButtons();
  }

  private indexButtons() {
    const buttons = this.el.querySelectorAll('super-tab-button');
    const buttonsArray = [];

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      button.index = i;

      if (this.activeTabIndex === i) {
        this.markButtonActive(button);
      }

      buttonsArray.push(button);
    }

    this.buttons = buttonsArray;
    this.alignIndicator(this.activeTabIndex);
  }

  private markButtonActive(button: HTMLSuperTabButtonElement) {
    if (this.activeButton) {
      this.activeButton.active = false;
    }

    button.active = true;
    this.activeButton = button;
  }

  private calcIndicatorAttrs(index: number) {
    const remainder = index % 1;
    const isDragging = remainder > 0;
    this.isDragging = isDragging;

    if (isDragging) {
      // we need to set position + scale based on % scrolled between the two tabs
      const buttonA = this.buttons[Math.floor(index)];
      const buttonB = this.buttons[Math.ceil(index)];

      const buttonAWidth = buttonA.clientWidth;
      const buttonAPosition = buttonA.offsetLeft;

      const buttonBWidth = buttonB.clientWidth;
      const buttonBPosition = buttonB.offsetLeft;

      const position = buttonAPosition + remainder * (buttonBPosition - buttonAPosition);
      const width = buttonAWidth + remainder * (buttonBWidth - buttonAWidth);

      this.indicatorPosition = position - this.el.scrollLeft;
      this.indicatorWidth = width;
    } else {
      // indicator should align perfectly with the active button
      const button = this.buttons[index];
      this.indicatorPosition = button.offsetLeft;
      this.indicatorWidth = button.clientWidth;
    }

    this.setStyles();
  }

  private alignIndicator(index: number) {
    if (!this.showIndicator) {
      return;
    }

    requestAnimationFrame(() => {
      this.calcIndicatorAttrs(index);
    });
  }

  setStyles() {
    if (!this.showIndicator || this.indicatorEl) {
      this.indicatorEl.style.setProperty('--st-indicator-position-x', this.indicatorPosition + 'px');
      this.indicatorEl.style.setProperty('--st-indicator-scale-x', String(this.indicatorWidth / 100));
      this.indicatorEl.style.setProperty('--st-indicator-transition-duration', this.isDragging? '0' : `${ this.config!.transitionDuration }ms`);
    }
  }

  hostData() {
    return {
      class: {
        ['ion-color-' + this.color]: true,
      }
    }
  }

  render() {
    return [
      <slot/>,
      this.showIndicator && <super-tab-indicator ref={(ref: any) => this.indicatorEl = ref} toolbarPosition={this.toolbarPosition}/>,
    ];
  }
}
